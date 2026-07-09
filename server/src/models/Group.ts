import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  goalAmount: number;
  currentSavings: number;
  trustScore: number;
  members: { profileId: mongoose.Types.ObjectId, name: string, streak: number }[];
  messages: { sender: string, text: string, timestamp: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema = new Schema({
  name: { type: String, required: true },
  goalAmount: { type: Number, required: true, default: 50000 },
  currentSavings: { type: Number, required: true, default: 0 },
  trustScore: { type: Number, default: 50 },
  members: [{
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    name: String,
    streak: { type: Number, default: 0 }
  }],
  messages: [{
    sender: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
