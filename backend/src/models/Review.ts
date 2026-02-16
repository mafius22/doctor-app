import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  doctorId: string;
  authorUserId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  doctorReply?: string;
  doctorReplyAt?: Date;
}

const ReviewSchema = new Schema<IReview>({
  doctorId: { type: String, required: true, ref: 'DoctorProfile' },
  authorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  doctorReply: { type: String, required: false }, 
  doctorReplyAt: { type: Date, required: false }
});

ReviewSchema.index({ doctorId: 1, authorUserId: 1 }, { unique: true });

export const Review = model<IReview>("Review", ReviewSchema);