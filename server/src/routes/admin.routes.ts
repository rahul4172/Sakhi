import express from 'express';
import Transaction from '../models/Transaction';
import AuditLog from '../models/AuditLog';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    const successfulTransactions = await Transaction.countDocuments({ status: 'SUCCESS' });
    const failedTransactions = await Transaction.countDocuments({ status: 'FAILED' });
    
    const revenuePipeline = await Transaction.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    const revenue = revenuePipeline.length > 0 ? revenuePipeline[0].totalAmount : 0;

    res.json({
      totalVolume: totalTransactions,
      successRate: totalTransactions ? ((successfulTransactions / totalTransactions) * 100).toFixed(2) : 0,
      failures: failedTransactions,
      revenue
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
