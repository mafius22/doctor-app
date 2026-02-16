import { Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { Appointment } from "../models/Appointment";
import { AvailabilityRule } from "../models/AvailabilityRule";
import { Absence } from "../models/Absence";

const parseLocal = (iso: string) => new Date(iso);
const dateToYMD = (d: Date) => d.toISOString().split("T")[0];
const dow1to7 = (d: Date) => d.getDay() === 0 ? 7 : d.getDay();
const timeToMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

export const reserveAppointment = async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      doctorId: z.string().min(1),
      startAt: z.string().min(16), 
      durationSlots: z.number().int().min(1).max(24),
      visitType: z.string().min(2),
      patient: z.object({
        fullName: z.string().min(2),
        gender: z.enum(["M", "F", "OTHER"]),
        age: z.number().int().min(0).max(120)
      }),
      notesForDoctor: z.string().optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const { doctorId, startAt, durationSlots, visitType, patient, notesForDoctor } = parsed.data;

    const start = parseLocal(startAt);
    if (Number.isNaN(start.getTime())) return res.status(400).json({ message: "Bad startAt" });

    const now = new Date();
    if (start < now) {
      return res.status(400).json({ message: "Nie można zarezerwować wizyty w przeszłości." });
    }

    const slotMinutes = 30;
    const end = new Date(start.getTime() + durationSlots * slotMinutes * 60 * 1000);
    const ymd = dateToYMD(start);

    const absences = await Absence.find({ doctorId });
    if (absences.some(a => ymd >= a.dateFrom && ymd <= a.dateTo)) {
      return res.status(409).json({ message: "Lekarz jest nieobecny w tym dniu." });
    }

    const rules = await AvailabilityRule.find({ doctorId });
    const dow = dow1to7(start);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();

    const fitsAnyRule = rules.some(r => {
      if (r.type === "ONE_TIME") {
        return r.date === ymd && r.timeRanges.some(tr => startMin >= timeToMinutes(tr.start) && endMin <= timeToMinutes(tr.end));
      }
      
      if (!r.dateFrom || !r.dateTo || !r.daysOfWeek?.includes(dow)) return false;
      if (ymd < r.dateFrom || ymd > r.dateTo) return false;
      
      return r.timeRanges.some(tr => startMin >= timeToMinutes(tr.start) && endMin <= timeToMinutes(tr.end));
    });

    if (!fitsAnyRule) return res.status(409).json({ message: "Termin poza godzinami przyjęć." });

    const busy = await Appointment.find({
      doctorId: new Types.ObjectId(doctorId),
      status: { $in: ["RESERVED", "CONFIRMED", "COMPLETED"] },
      startAt: { $lt: end },
      endAt: { $gt: start }
    });

    if (busy.length > 0) return res.status(409).json({ message: "Ten termin jest już zarezerwowany." });

    const created = await Appointment.create({
      doctorId: new Types.ObjectId(doctorId),
      patientUserId: new Types.ObjectId(req.user!.userId),
      startAt: start,
      endAt: end,
      status: "RESERVED",
      visitType,
      patientSnapshot: patient,
      notesForDoctor
    });

    return res.json({ id: String(created._id), status: created.status });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Błąd serwera podczas rezerwacji." });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const appt = await Appointment.findById(id);

    if (!appt) {
      return res.status(404).json({ message: "Wizyta nie istnieje." });
    }

    if (appt.patientUserId.toString() !== userId) {
      return res.status(403).json({ message: "Brak dostępu do tej wizyty." });
    }

    if (appt.status === 'COMPLETED') {
      return res.status(400).json({ message: "Nie można odwołać zakończonej wizyty." });
    }

    appt.status = "CANCELLED";
    await appt.save();

    res.json({ message: "Wizyta została odwołana.", appointmentId: id });
  } catch (error) {
    console.error("Błąd anulowania:", error);
    res.status(500).json({ message: "Błąd serwera." });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  
  const appt = await Appointment.findById(appointmentId);
  if (!appt) return res.status(404).json({ message: "Not found" });
  
  if (String(appt.patientUserId) !== req.user!.userId) {
    return res.status(403).json({ message: "Not your appointment" });
  }

  if (appt.status !== "RESERVED") {
    return res.status(400).json({ message: "Can only confirm RESERVED appointments" });
  }

  appt.status = "CONFIRMED";
  await appt.save();

  res.json({ ok: true, status: appt.status });
};


export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const appointments = await Appointment.find({ patientUserId: userId })
      .sort({ startAt: -1 })
      .populate({
        path: "doctorId",
        model: "DoctorProfile", 
        select: "fullName specialization" 
      });

    res.json(appointments);
  } catch (error) {
    console.error("Błąd pobierania wizyt:", error);
    res.status(500).json({ message: "Błąd serwera." });
  }
};