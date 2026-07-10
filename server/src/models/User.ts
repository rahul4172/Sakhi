import mongoose, { Document, Schema } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetToken: {
    type: String
  },
  resetTokenExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
UserSchema.pre('save', async function (this: any) {
  const user = this;
  if (!user.isModified('password') || !user.password) {
    return;
  }
  try {
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(user.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (this: any, password: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcryptjs.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
