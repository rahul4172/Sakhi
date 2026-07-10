import { MockBBPSProvider } from '../providers/MockBBPSProvider';
import Transaction from '../models/Transaction';
import AuditLog from '../models/AuditLog';

const provider = new MockBBPSProvider();

export class PaymentService {
  
  static async fetchBill(billerId: string, consumerNumber: string) {
    const res = await provider.fetchBill(billerId, consumerNumber);
    return res;
  }

  static async initiatePayment(userId: string, billId: string, billerId: string, amount: number) {
    // Duplicate check
    const existing = await Transaction.findOne({ billId, status: 'SUCCESS' });
    if (existing) {
      throw new Error('DUPLICATE_PAYMENT');
    }

    // Call Provider
    let paymentResponse;
    try {
      paymentResponse = await provider.payBill(billId, amount, 'UPI');
    } catch (e: any) {
      if (e.message === 'PROVIDER_TIMEOUT') {
        const tx = await Transaction.create({
          transactionId: 'TX' + Date.now(),
          referenceId: 'TIMEOUT',
          userId,
          billId,
          billerId,
          amount,
          status: 'TIMEOUT',
          errorMessage: 'Provider timed out'
        });
        await AuditLog.create({ action: 'PAYMENT_TIMEOUT', userId, details: { billId } });
        return tx;
      }
      throw e;
    }

    // Save transaction
    const tx = await Transaction.create({
      transactionId: paymentResponse.transactionId,
      referenceId: paymentResponse.referenceId,
      userId,
      billId,
      billerId,
      amount,
      status: paymentResponse.status as any,
      errorMessage: paymentResponse.status === 'FAILED' ? paymentResponse.message : ''
    });

    if (tx.status === 'SUCCESS') {
      tx.receiptUrl = `/api/bbps/receipt/${tx.transactionId}`;
      await tx.save();
      await AuditLog.create({ action: 'PAYMENT_SUCCESS', userId, details: { txId: tx.transactionId } });
    } else {
      await AuditLog.create({ action: 'PAYMENT_FAILED', userId, details: { txId: tx.transactionId } });
    }

    return tx;
  }
}
