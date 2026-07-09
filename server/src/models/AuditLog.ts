import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  timestamp: Date;
  ip: string;
  session: string;
  action: string;
  details: any;
  userId: string;
}

const AuditLogSchema: Schema = new Schema({
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  session: { type: String },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  userId: { type: String }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
