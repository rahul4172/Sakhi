import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  language: { type: String, default: 'en' },
  notificationsEnabled: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
