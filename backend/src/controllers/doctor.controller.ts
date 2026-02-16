
import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { AvailabilityRule } from "../models/AvailabilityRule";
import { Absence } from "../models/Absence";
import { Appointment } from "../models/Appointment";

async function getMyDoctorId(userId: string) {
  const me = await User.findById(userId);
  return me?.doctorProfileId ? String(me.doctorProfileId) : null;
}

export const getMe = async (req: Request, res: Response) => {
  const doctorId = await getMyDoctorId(req.user!.userId);
  if (!doctorId) return res.status(400).json({ message: "Missing profile" });
  res.json({ doctorId });
};

export const addAvailability = async (req: Request, res: Response) => {
  const doctorId = await getMyDoctorId(req.user!.userId);
  if (!doctorId) return res.status(400).json({ message: "Missing profile" });

  const schema = z.object({
    type: z.enum(["RECURRING", "ONE_TIME"]),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    daysOfWeek: z.array(z.number().min(1).max(7)).optional(),
    date: z.string().optional(),
    timeRanges: z.array(z.object({ start: z.string(), end: z.string() })).min(1),
    slotMinutes: z.number().int().min(10).max(60).default(30)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const created = await AvailabilityRule.create({ doctorId, ...parsed.data });
  
  
  res.json({ id: String(created._id) });
};

export const getAvailability = async (req: Request, res: Response) => {
  const doctorId = await getMyDoctorId(req.user!.userId);
  const rules = await AvailabilityRule.find({ doctorId }).sort({ createdAt: -1 });
  res.json(rules);
};

export const getAbsences = async (req: Request, res: Response) => {
  const doctorId = await getMyDoctorId(req.user!.userId);
  const absences = await Absence.find({ doctorId }).sort({ createdAt: -1 });
  res.json(absences);
};

export const addAbsence = async (req: Request, res: Response) => {
  const doctorId = await getMyDoctorId(req.user!.userId);
  if (!doctorId) return res.status(400).json({ message: "Missing profile" });

  const schema = z.object({ 
    dateFrom: z.string(),
    dateTo: z.string(),
    reason: z.string().optional() 
  });
  
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  
  const created = await Absence.create({ doctorId, ...parsed.data });

  const fromDate = new Date(parsed.data.dateFrom + "T00:00:00");
  const toDate = new Date(parsed.data.dateTo + "T23:59:59");

  const conflicts = await Appointment.find({
    doctorId,
    status: { $in: ["RESERVED", "CONFIRMED"] },
    startAt: { $gte: fromDate, $lte: toDate }
  });

  if (conflicts.length > 0) {
    await Appointment.updateMany(
      { _id: { $in: conflicts.map(c => c._id) } },
      { $set: { status: "CANCELLED", cancelReason: "Lekarz zgłosił nieobecność" } }
    );

    const io = req.app.get("socketio");
    conflicts.forEach(appt => {
      io.emit("appointment_cancelled", { 
        appointmentId: appt._id, 
        patientId: appt.patientUserId,
        reason: "Lekarz odwołał wizytę z powodu nieobecności."
      });
    });
  }

  res.json({ 
    id: String(created._id), 
    cancelledAppointments: conflicts.length 
  });
};

export const completeAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params; 
    const userId = req.user!.userId; 

    
    const appt = await Appointment.findById(appointmentId);
    if (!appt) {
      return res.status(404).json({ message: "Wizyta nie istnieje." });
    }

    const doctorUser = await User.findById(userId);
    
    if (!doctorUser || !doctorUser.doctorProfileId) {
      return res.status(403).json({ message: "Brak profilu lekarza." });
    }

    if (appt.doctorId.toString() !== doctorUser.doctorProfileId.toString()) {
      return res.status(403).json({ message: "To nie jest Twoja wizyta." });
    }

    if (appt.status === 'CANCELLED') {
        return res.status(400).json({ message: "Nie można zakończyć odwołanej wizyty." });
    }

    appt.status = 'COMPLETED';
    await appt.save();

    res.json({ message: "Wizyta oznaczona jako zrealizowana." });

  } catch (error) {
    console.error("Błąd completeAppointment:", error);
    res.status(500).json({ message: "Błąd serwera." });
  }
};