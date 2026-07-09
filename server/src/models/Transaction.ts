import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  referenceId: string;
  userId: string;
  billId: string;
  billerId: string;
  amount: number;
  date: Date;
  status: 'INITIATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'REVERSED' | 'PENDING';
  receiptUrl?: string;
  errorMessage?: string;
}

const TransactionSchema: Schema = new Schema({
  transactionId: { type: String, required: true, unique: true },
  referenceId: { type: String, required: true },
  userId: { type: String, required: true }, // referencing Profile sessionId for now since auth isn't present
  billId: { type: String, required: true },
  billerId: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'REVERSED', 'PENDING'], 
    default: 'INITIATED' 
  },
  receiptUrl: { type: String },
  errorMessage: { type: String }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
