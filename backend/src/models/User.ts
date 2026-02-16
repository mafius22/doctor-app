import { Schema, model, Types } from "mongoose";

export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export interface IUser {
  email: string;
  passwordHash: string;
  role: Role;
  displayName: string;
  doctorProfileId?: Types.ObjectId;
  isBannedFromReviews: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["PATIENT", "DOCTOR", "ADMIN"], required: true },
    displayName: { type: String, required: true },
    doctorProfileId: { type: Schema.Types.ObjectId, ref: "DoctorProfile" },
    isBannedFromReviews: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
