import express from 'express';
import { PaymentService } from '../services/PaymentService';
import Biller from '../models/Biller';
import Transaction from '../models/Transaction';
import { ReceiptGeneratorService } from '../services/ReceiptGeneratorService';
import { getIO } from '../SocketServer';
import { profileRepository } from '../repositories/ProfileRepository';
import { blockchainService } from '../services/blockchainService';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = express.Router();

const safeEmit = (userId: string, event: string, payload: any) => {
  try {
    getIO().to(userId).emit(event, payload);
  } catch (e) {
    console.log(`[Socket.io] Skip emit: Socket server not initialized (${event})`);
  }
};

// ... existing code ...
router.get('/billers', async (req, res) => {
  try {
    const billers = await Biller.find({});
    res.json(billers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pay/order', async (req, res) => {
  const { userId, billId, billerId, amount } = req.body;
  try {
    const existing = await Transaction.findOne({ billId, status: 'SUCCESS' });
    if (existing) {
      return res.status(400).json({ error: 'DUPLICATE_PAYMENT' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.log('Razorpay credentials not set. Generating sandbox order.');
      return res.json({
        orderId: 'order_sandbox_' + Date.now(),
        amount: amount,
        key: 'rzp_test_sandbox',
        sandbox: true
      });
    }

    const rzp = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const order = await rzp.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `receipt_bill_${billId}`
    });

    res.json({
      orderId: order.id,
      amount: amount,
      key: keyId,
      sandbox: false
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pay/verify', async (req, res) => {
  const { 
    userId, 
    billId, 
    billerId, 
    amount, 
    razorpay_payment_id, 
    razorpay_order_id, 
    razorpay_signature 
  } = req.body;

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let verified = false;

    if (razorpay_order_id?.startsWith('order_sandbox_')) {
      verified = true;
    } else {
      if (!keyId || !keySecret) {
        return res.status(400).json({ error: 'Razorpay keys not configured' });
      }
      
      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest('hex');
      verified = generatedSignature === razorpay_signature;
    }

    if (!verified) {
      return res.status(400).json({ error: 'PAYMENT_SIGNATURE_INVALID' });
    }

    const tx = await Transaction.create({
      transactionId: razorpay_payment_id || 'TX_SANDBOX_' + Date.now(),
      referenceId: 'REF_' + Date.now(),
      userId,
      billId,
      billerId,
      amount,
      status: 'SUCCESS',
      errorMessage: ''
    });

    tx.receiptUrl = `/api/bbps/receipt/${tx.transactionId}`;
    await tx.save();

    try {
      const profile = await profileRepository.findBySessionId(userId);
      if (profile) {
        if (!profile.walletAddress) {
          const wallet = blockchainService.generateUserWallet();
          profile.walletAddress = wallet.address;
          profile.encryptedPrivateKey = wallet.encryptedPrivateKey;
          profile.blockchainNetwork = blockchainService.getMode();
        }

        const txResult = await blockchainService.earnTokens(
          profile.walletAddress,
          50,
          'Bill Payment Reward'
        );

        if (!profile.tokenHistory) profile.tokenHistory = [];
        profile.tokenHistory.push({
          amount: 50,
          type: 'earn' as const,
          description: 'Bill Payment Reward',
          date: new Date(),
          transactionHash: txResult.transactionHash || undefined,
          status: txResult.status,
          error: txResult.error
        });

        if (txResult.status === 'success') {
          profile.tokenBalance = (profile.tokenBalance ?? 0) + 50;
        }
        await profile.save();

        safeEmit(userId, 'tokens_updated', { 
          balance: profile.tokenBalance, 
          earned: 50,
          transactionHash: txResult.transactionHash
        });
      }
    } catch (tokenErr) {
      console.error('Error awarding payment tokens on-chain:', tokenErr);
    }

    safeEmit(userId, 'payment_success', { transactionId: tx.transactionId, amount });
    safeEmit(userId, 'score_updated', { points: 5, reason: 'On-time bill payment' });

    res.json(tx);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fetch', async (req, res) => {
  const { billerId, consumerNumber } = req.body;
  try {
    const bill = await PaymentService.fetchBill(billerId, consumerNumber);
    res.json(bill);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pay', async (req, res) => {
  const { userId, billId, billerId, amount } = req.body;
  try {
    const tx = await PaymentService.initiatePayment(userId, billId, billerId, amount);
    
    if (tx.status === 'SUCCESS') {
      // Notify client
      safeEmit(userId, 'payment_success', { transactionId: tx.transactionId, amount });
      
      // Notify SakhiScore update (Mock live score update)
      safeEmit(userId, 'score_updated', { points: 5, reason: 'On-time bill payment' });
 
      // Reward tokens on-chain: Add 50 SAKHI Tokens
      try {
        const profile = await profileRepository.findBySessionId(userId);
        if (profile) {
          if (!profile.walletAddress) {
            const wallet = blockchainService.generateUserWallet();
            profile.walletAddress = wallet.address;
            profile.encryptedPrivateKey = wallet.encryptedPrivateKey;
            profile.blockchainNetwork = blockchainService.getMode();
          }

          const txResult = await blockchainService.earnTokens(
            profile.walletAddress,
            50,
            'Bill Payment Reward'
          );

          if (!profile.tokenHistory) profile.tokenHistory = [];
          profile.tokenHistory.push({
            amount: 50,
            type: 'earn' as const,
            description: 'Bill Payment Reward',
            date: new Date(),
            transactionHash: txResult.transactionHash || undefined,
            status: txResult.status,
            error: txResult.error
          });

          if (txResult.status === 'success') {
            profile.tokenBalance = (profile.tokenBalance ?? 0) + 50;
            await profile.save();
            safeEmit(userId, 'tokens_updated', { 
              balance: profile.tokenBalance, 
              earned: 50,
              transactionHash: txResult.transactionHash
            });
          } else {
            await profile.save();
          }
        }
      } catch (tokenErr) {
        console.error('Error awarding payment tokens on-chain:', tokenErr);
      }
    } else {
      safeEmit(userId, 'payment_failed', { transactionId: tx.transactionId, reason: tx.errorMessage });
    }

    res.json(tx);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const txs = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(txs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/receipt/:txId', async (req, res) => {
  try {
    const pdfBuffer = await ReceiptGeneratorService.generateReceipt(req.params.txId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${req.params.txId}.pdf`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
