import mongoose, { Document, Schema } from 'mongoose';

export interface IBill extends Document {
  userId: string;
  billerName: string;
  amount: number;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  recurrence: 'one-time' | 'monthly' | 'quarterly';
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  billerName: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' },
  recurrence: { type: String, enum: ['one-time', 'monthly', 'quarterly'], default: 'monthly' }
}, { timestamps: true });

export default mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);
