import { Request, Response } from "express";
import { DoctorProfile } from "../models/DoctorProfile";
import { AvailabilityRule } from "../models/AvailabilityRule";
import { Absence } from "../models/Absence";
import { User } from "../models/User";

export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const specialization = (req.query.specialization as string | undefined)?.trim();
    const filter = specialization ? { specialization } : {};
    
    const doctors = await DoctorProfile.find(filter).sort({ fullName: 1 });

    const result = doctors.map(d => ({
      id: String(d._id),
      fullName: d.fullName,
      specialization: d.specialization
    }));

    return res.json(result);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDoctorScheduleRules = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.doctorId;

    if (req.user?.role === "DOCTOR") {
      const me = await User.findById(req.user.userId);
      const myDoctorId = me?.doctorProfileId ? String(me.doctorProfileId) : null;
      
      if (!myDoctorId || myDoctorId !== doctorId) {
        return res.status(403).json({ message: "Doctor can view only own schedule" });
      }
    }

    const rules = await AvailabilityRule.find({ doctorId }).sort({ createdAt: -1 });
    const absences = await Absence.find({ doctorId }).sort({ createdAt: -1 });

    return res.json({ doctorId, rules, absences });
  } catch (error) {
    console.error("Error fetching schedule rules:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};