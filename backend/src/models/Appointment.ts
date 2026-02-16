import { Schema, model, Types } from "mongoose";

export type AppointmentStatus = "RESERVED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface IAppointment {
  doctorId: Types.ObjectId; 
  patientUserId: Types.ObjectId;

  startAt: Date;
  endAt: Date;

  status: AppointmentStatus;
  visitType: string;

  patientSnapshot: {
    fullName: string;
    gender: "M" | "F" | "OTHER";
    age: number;
  };

  notesForDoctor?: string;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    doctorId: { 
      type: Schema.Types.ObjectId, 
      ref: "DoctorProfile",
      required: true, 
      index: true 
    },
    
    patientUserId: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true, 
      index: true 
    },

    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },

    status: { type: String, enum: ["RESERVED", "CONFIRMED", "CANCELLED", "COMPLETED"], required: true },
    visitType: { type: String, required: true },

    patientSnapshot: {
      fullName: { type: String, required: true },
      gender: { type: String, enum: ["M", "F", "OTHER"], required: true },
      age: { type: Number, required: true }
    },

    notesForDoctor: { type: String }
  },
  { timestamps: true }
);

AppointmentSchema.index({ doctorId: 1, startAt: 1, endAt: 1 });

export const Appointment = model<IAppointment>("Appointment", AppointmentSchema);