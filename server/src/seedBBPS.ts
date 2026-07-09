import mongoose from 'mongoose';
import Biller from './models/Biller';
import Transaction from './models/Transaction';
import AuditLog from './models/AuditLog';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sakhi';

const BILLERS = [
  { billerId: 'ELEC001', name: 'State Electricity Board', logo: '⚡', category: 'Electricity', provider: 'MOCK_BBPS', consumerRegex: '^[0-9]{10,12}$', minLength: 10, maxLength: 12, sampleIds: ['1234567890'] },
  { billerId: 'WAT002', name: 'Municipal Water Dept', logo: '💧', category: 'Water', provider: 'MOCK_BBPS', consumerRegex: '^[0-9]{8}$', minLength: 8, maxLength: 8, sampleIds: ['11223344'] },
  { billerId: 'GAS003', name: 'City Gas Distribution', logo: '🔥', category: 'Gas', provider: 'MOCK_BBPS', consumerRegex: '^[A-Z0-9]{10}$', minLength: 10, maxLength: 10, sampleIds: ['GA12345678'] },
  { billerId: 'MOB004', name: 'Telecom Postpaid', logo: '📱', category: 'Mobile Postpaid', provider: 'MOCK_BBPS', consumerRegex: '^[0-9]{10}$', minLength: 10, maxLength: 10, sampleIds: ['9876543210'] },
  { billerId: 'BROAD005', name: 'Fastnet Broadband', logo: '🌐', category: 'Broadband', provider: 'MOCK_BBPS', consumerRegex: '^[0-9]{8,10}$', minLength: 8, maxLength: 10, sampleIds: ['88776655'] }
];

export async function seedBBPS() {
  try {
    const billerCount = await Biller.countDocuments();
    if (billerCount > 0) {
      console.log('BBPS data already seeded. Skipping seeding.');
      return;
    }

    console.log('Seeding BBPS models...');

    // Seed Billers
    await Biller.insertMany(BILLERS);
    console.log('Inserted Billers');

    // Generate 10000+ mock transactions
    const transactions = [];
    const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED', 'TIMEOUT'];
    let startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // 6 months of data

    console.log('Generating 10,000 mock transactions... this might take a few seconds.');
    for (let i = 0; i < 10000; i++) {
      const b = BILLERS[Math.floor(Math.random() * BILLERS.length)];
      const randomDays = Math.floor(Math.random() * 180);
      const txDate = new Date(startDate.getTime());
      txDate.setDate(txDate.getDate() + randomDays);
      
      transactions.push({
        transactionId: uuidv4(),
        referenceId: 'REF' + Math.floor(100000000 + Math.random() * 900000000).toString(),
        userId: 'MOCK_USER_ID_' + Math.floor(Math.random() * 500),
        billId: 'BILL' + Math.floor(10000 + Math.random() * 90000).toString(),
        billerId: b.billerId,
        amount: Math.floor(500 + Math.random() * 2000),
        date: txDate,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        receiptUrl: `/api/bbps/receipt/${uuidv4()}`
      });
    }

    // Insert transactions in chunks
    const chunkSize = 1000;
    for (let i = 0; i < transactions.length; i += chunkSize) {
      await Transaction.insertMany(transactions.slice(i, i + chunkSize));
    }
    console.log(`Inserted ${transactions.length} Transactions`);

    console.log('BBPS Data Seeding Complete!');
  } catch (err) {
    console.error('Error seeding BBPS data:', err);
  }
}
