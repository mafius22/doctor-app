import { Schema, model } from "mongoose";

export interface IAbsence {
  doctorId: string;
  dateFrom: string;
  dateTo: string;
  reason?: string;
}

const AbsenceSchema = new Schema<IAbsence>(
  {
    doctorId: { type: String, required: true, index: true },
    dateFrom: { type: String, required: true },
    dateTo: { type: String, required: true },
    reason: { type: String }
  },
  { timestamps: true }
);

export const Absence = model<IAbsence>("Absence", AbsenceSchema);
