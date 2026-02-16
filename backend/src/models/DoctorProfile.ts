import { Schema, model } from "mongoose";

export interface IDoctorProfile {
  fullName: string;
  specialization: string;
}

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    fullName: { type: String, required: true },
    specialization: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

export const DoctorProfile = model<IDoctorProfile>("DoctorProfile", DoctorProfileSchema);
