import mongoose, { Schema, Document } from 'mongoose';

export interface IBiller extends Document {
  billerId: string;
  name: string;
  logo: string;
  category: string;
  provider: string;
  consumerRegex: string;
  minLength: number;
  maxLength: number;
  sampleIds: string[];
}

const BillerSchema: Schema = new Schema({
  billerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  logo: { type: String, required: true },
  category: { type: String, required: true },
  provider: { type: String, required: true },
  consumerRegex: { type: String, required: true },
  minLength: { type: Number, required: true },
  maxLength: { type: Number, required: true },
  sampleIds: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<IBiller>('Biller', BillerSchema);
