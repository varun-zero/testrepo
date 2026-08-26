import mongoose, { Schema, Document, Types } from 'mongoose';
import './EventModel';
import './MediaAsset';
import './User';

export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted';
export type PaymentStatus = 'submitted' | 'verified' | 'rejected';

export interface IRegistration extends Document {
  eventId?: Types.ObjectId;
  squadName: string;
  domain: string;
  leader: {
    fullName: string;
    email: string;
    phone: string;
    college: string;
  };
  members: {
    fullName: string;
    email: string;
  }[];
  transactionId: string;
  transactionKey?: string;
  paymentScreenshot: string;
  paymentProof?: Types.ObjectId;
  payment: {
    status: PaymentStatus;
    verifiedBy?: Types.ObjectId;
    verifiedAt?: Date;
    note?: string;
  };
  status: RegistrationStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  certificateEligible: boolean;
  formData?: Record<string, unknown>;
  createdAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  squadName: { type: String, default: 'Squad' },
  domain: { type: String, default: 'General' },
  leader: {
    fullName: { type: String, default: 'Participant' },
    email: { type: String, default: 'no-email@registration.local' },
    phone: { type: String, default: 'N/A' },
    college: { type: String, default: 'N/A' },
  },
  members: [
    {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
    }
  ],
  transactionId: { type: String, default: 'FREE-REGISTRATION' },
  transactionKey: { type: String },
  paymentScreenshot: { type: String, default: '' },
  paymentProof: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
  payment: {
    status: { type: String, enum: ['submitted', 'verified', 'rejected'], default: 'submitted' },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    note: { type: String },
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'waitlisted'], default: 'pending' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  certificateEligible: { type: Boolean, default: false },
  formData: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

RegistrationSchema.index({ domain: 1, createdAt: -1 });
RegistrationSchema.index({ status: 1, createdAt: -1 });
RegistrationSchema.index({ 'leader.email': 1 });
RegistrationSchema.index({ eventId: 1, status: 1 });
RegistrationSchema.index({ 'payment.status': 1 });
RegistrationSchema.index({ transactionKey: 1 }, { unique: true, sparse: true });

const Registration = (mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema)) as mongoose.Model<IRegistration>;
export default Registration;
