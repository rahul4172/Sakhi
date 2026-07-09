import mongoose, { Document, Schema } from 'mongoose';

export interface ILoanMatch extends Document {
  userId: string;
  schemeId: mongoose.Types.ObjectId;
  matchScore: number;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'APPLIED' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const LoanMatchSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: true },
  matchScore: { type: Number, required: true },
  status: { type: String, enum: ['ELIGIBLE', 'NOT_ELIGIBLE', 'APPLIED', 'APPROVED', 'REJECTED'], default: 'ELIGIBLE' }
}, { timestamps: true });

export default mongoose.models.LoanMatch || mongoose.model<ILoanMatch>('LoanMatch', LoanMatchSchema);
