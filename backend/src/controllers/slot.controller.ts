import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { AvailabilityRule } from "../models/AvailabilityRule";
import { Absence } from "../models/Absence";
import { Appointment } from "../models/Appointment";

const pad2 = (n: number) => String(n).padStart(2, "0");
const minutesToTime = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const timeToMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const dateToYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseLocalYMD = (ymd: string) => new Date(`${ymd}T00:00:00`);
const addDays = (d: Date, days: number) => { const x = new Date(d); x.setDate(x.getDate() + days); return x; };
const dow1to7 = (d: Date) => d.getDay() === 0 ? 7 : d.getDay();
const overlaps = (aS: Date, aE: Date, bS: Date, bE: Date) => aS < bE && bS < aE;

const mergeRanges = (ranges: Array<{ startMin: number; endMin: number }>) => {
  const sorted = ranges.filter(r => r.endMin > r.startMin).sort((a, b) => a.startMin - b.startMin);
  const out: typeof ranges = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (!last || r.startMin > last.endMin) out.push({ ...r });
    else last.endMin = Math.max(last.endMin, r.endMin);
  }
  return out;
};

export const getDoctorSlots = async (req: Request, res: Response) => {
  const doctorId = req.params.doctorId;

  if (req.user?.role === "DOCTOR") {
    const me = await User.findById(req.user.userId);
    const myDoctorId = me?.doctorProfileId ? String(me.doctorProfileId) : null; 
    
    if (!myDoctorId || myDoctorId !== doctorId) {
    }
  }

  const querySchema = z.object({
    weekStart: z.string().optional(),
    slotMinutes: z.coerce.number().int().min(10).max(60).optional()
  });
  
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json(parsed.error);
  
  const slotMinutes = parsed.data.slotMinutes ?? 30;
  const today = new Date();
  const defaultWeekStart = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - (dow1to7(d) - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  
  const weekStart = parsed.data.weekStart ? parseLocalYMD(parsed.data.weekStart) : defaultWeekStart;
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const rules = await AvailabilityRule.find({ doctorId });
  const absences = await Absence.find({ doctorId });
  
  const activeAppointments = await Appointment.find({
    doctorId,
    status: { $in: ["RESERVED", "CONFIRMED", "COMPLETED"] },
    startAt: { $lt: weekEnd },
    endAt: { $gt: weekStart }
  }).sort({ startAt: 1 });

  const isAbsentDay = (d: Date) => {
    const ymd = dateToYMD(d);
    return absences.some(a => ymd >= a.dateFrom && ymd <= a.dateTo);
  };

  const dayRanges = days.map(d => {
    const ymd = dateToYMD(d);
    const dow = dow1to7(d);
    const ranges: Array<{ startMin: number; endMin: number }> = [];

    for (const r of rules) {
      if (r.type === "ONE_TIME") {
        if (r.date !== ymd) continue;
      } else {
        if (!r.dateFrom || !r.dateTo || !r.daysOfWeek?.includes(dow)) continue;
        if (ymd < r.dateFrom || ymd > r.dateTo) continue;
      }
      for (const tr of r.timeRanges) {
        ranges.push({ startMin: timeToMinutes(tr.start), endMin: timeToMinutes(tr.end) });
      }
    }
    return mergeRanges(ranges);
  });

  let globalMin = Infinity;
  let globalMax = -Infinity;
  dayRanges.flat().forEach(r => {
    globalMin = Math.min(globalMin, r.startMin);
    globalMax = Math.max(globalMax, r.endMin);
  });

  if (!isFinite(globalMin) || !isFinite(globalMax)) {
     return res.json({ doctorId, weekStart: dateToYMD(weekStart), slotMinutes, timeAxis: [], days: [] });
  }

  const timeAxis: string[] = [];
  const lastStart = globalMax - slotMinutes;
  for (let m = globalMin; m <= lastStart; m += slotMinutes) {
    timeAxis.push(minutesToTime(m));
  }

  const responseDays = days.map((d, dayIdx) => {
    const ymd = dateToYMD(d);
    const absent = isAbsentDay(d);
    const ranges = dayRanges[dayIdx];
    
    const cells = timeAxis.map(t => {
      const startMin = timeToMinutes(t);
      const endMin = startMin + slotMinutes;
      let status: "UNAVAILABLE" | "FREE" | "BOOKED" | "ABSENT" = "UNAVAILABLE";

      if (ranges.some(r => startMin >= r.startMin && endMin <= r.endMin)) status = "FREE";
      if (absent && status !== "UNAVAILABLE") status = "ABSENT";
      
      const slotStart = new Date(`${ymd}T${t}:00`);
      const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60000);
      
      let appointmentId: string | null = null;
      let visitType: string | null = null;
      
      let patientSnapshot: any = null;
      let notesForDoctor: string | null = null;

      if (status !== "UNAVAILABLE" && status !== "ABSENT") {
        for (const appt of activeAppointments) {
           if (overlaps(slotStart, slotEnd, appt.startAt, appt.endAt)) {
             status = "BOOKED";
             appointmentId = String(appt._id);
             visitType = appt.visitType;
             
             patientSnapshot = appt.patientSnapshot;
             notesForDoctor = appt.notesForDoctor || null;
           }
        }
      }

      return {
        time: t,
        status,
        isPast: slotEnd.getTime() < Date.now(),
        appointmentId,
        visitType,
        patientSnapshot, 
        notesForDoctor
      };
    });

    return {
      date: ymd,
      dow: dow1to7(d),
      isToday: ymd === dateToYMD(today),
      isAbsent: absent,
      bookedCount: activeAppointments.filter(a => dateToYMD(a.startAt) === ymd).length,
      cells
    };
  });

  return res.json({
    doctorId,
    weekStart: dateToYMD(weekStart),
    slotMinutes,
    timeAxis,
    days: responseDays
  });
};