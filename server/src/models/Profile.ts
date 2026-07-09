import mongoose, { Document, Schema } from 'mongoose';

export interface IProfile extends Document {
  sessionId: string;
  name: string;
  occupation: 'tailoring' | 'beauty' | 'tiffin service' | 'handicrafts' | 'SHG member' | 'other';
  currentScore: number;
  scoreHistory: { score: number; date: Date }[];
  tokenBalance: number;
  tokenHistory: { 
    amount: number; 
    type: 'earn' | 'redeem'; 
    description: string; 
    date: Date;
    transactionHash?: string;
    status?: 'pending' | 'success' | 'failed';
    error?: string;
  }[];
  walletAddress?: string;
  encryptedPrivateKey?: string;
  blockchainNetwork?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  occupation: {
    type: String,
    required: true,
    enum: ['tailoring', 'beauty', 'tiffin service', 'handicrafts', 'SHG member', 'other']
  },
  currentScore: { type: Number, default: 0 },
  scoreHistory: [{
    score: Number,
    date: { type: Date, default: Date.now }
  }],
  tokenBalance: { type: Number, default: 0 },
  tokenHistory: [{
    amount: Number,
    type: { type: String, enum: ['earn', 'redeem'] },
    description: String,
    date: { type: Date, default: Date.now },
    transactionHash: String,
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
    error: String
  }],
  walletAddress: { type: String },
  encryptedPrivateKey: { type: String },
  blockchainNetwork: { type: String }
}, { timestamps: true });

export default mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
