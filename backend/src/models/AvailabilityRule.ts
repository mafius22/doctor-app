import { Schema, model } from "mongoose";

export type AvailabilityType = "RECURRING" | "ONE_TIME";

export interface ITimeRange {
  start: string;
  end: string;
}

export interface IAvailabilityRule {
  doctorId: string;
  type: AvailabilityType;

  dateFrom?: string;
  dateTo?: string;
  daysOfWeek?: number[];

  date?: string;
  timeRanges: ITimeRange[];

  slotMinutes: number;
}

const TimeRangeSchema = new Schema<ITimeRange>(
  { start: { type: String, required: true }, end: { type: String, required: true } },
  { _id: false }
);

const AvailabilityRuleSchema = new Schema<IAvailabilityRule>(
  {
    doctorId: { type: String, required: true, index: true },
    type: { type: String, enum: ["RECURRING", "ONE_TIME"], required: true },

    dateFrom: { type: String },
    dateTo: { type: String },
    daysOfWeek: { type: [Number] },

    date: { type: String },
    timeRanges: { type: [TimeRangeSchema], required: true },

    slotMinutes: { type: Number, default: 30 }
  },
  { timestamps: true }
);

export const AvailabilityRule = model<IAvailabilityRule>("AvailabilityRule", AvailabilityRuleSchema);
