import mongoose, { Document, Schema } from 'mongoose';

export interface IIncome extends Document {
  userId: string;
  amount: number;
  source: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  source: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);
