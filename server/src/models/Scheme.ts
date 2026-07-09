import mongoose, { Document, Schema } from 'mongoose';

export interface IScheme extends Document {
  title: string;
  provider: string;
  type: string;
  description: string;
  eligibility: string[];
  maxAmount: number;
  interestRate?: number;
  minScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SchemeSchema: Schema = new Schema({
  title: { type: String, required: true },
  provider: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String },
  eligibility: [{ type: String }],
  maxAmount: { type: Number, required: true },
  interestRate: { type: Number },
  minScore: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Scheme || mongoose.model<IScheme>('Scheme', SchemeSchema);
