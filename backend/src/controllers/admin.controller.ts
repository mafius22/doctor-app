import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Settings } from "../models/Settings";
import { User } from "../models/User";
import { Review } from "../models/Review";
import { DoctorProfile } from "../models/DoctorProfile";

export const getSettings = async (_req: Request, res: Response) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({ authPersistence: "LOCAL" });
    res.json(s);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAuthPersistence = async (req: Request, res: Response) => {
  try {
    const schema = z.object({ mode: z.enum(["LOCAL", "SESSION", "NONE"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    let s = await Settings.findOne();
    if (!s) s = await Settings.create({ authPersistence: parsed.data.mode });
    
    s.authPersistence = parsed.data.mode;
    await s.save();

    res.json(s);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.email(),
      password: z.string().min(6),
      fullName: z.string().min(2),
      specialization: z.string().min(2)
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const exists = await User.findOne({ email: parsed.data.email });
    if (exists) return res.status(409).json({ message: "Email already exists" });

    const profile = await DoctorProfile.create({
      fullName: parsed.data.fullName,
      specialization: parsed.data.specialization
    });

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const user = await User.create({
      email: parsed.data.email,
      passwordHash,
      role: "DOCTOR",
      displayName: parsed.data.fullName,
      doctorProfileId: profile._id,
      isBannedFromReviews: false
    });

    res.json({ userId: String(user._id), doctorId: String(profile._id) });
  } catch (error) {
    console.error("Create doctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: { $ne: "ADMIN" } })
      .select("email displayName role isBannedFromReviews createdAt")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { ban } = req.body; 
    
    if (typeof ban !== 'boolean') {
      return res.status(400).json({ message: "Body 'ban' must be boolean" });
    }

    const user = await User.findByIdAndUpdate(userId, { isBannedFromReviews: ban }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ ok: true, isBanned: user.isBannedFromReviews });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ ok: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error) {
    console.error("Błąd podczas pobierania wszystkich opinii:", error);
    return res.status(500).json({ 
      message: "Wystąpił błąd serwera podczas pobierania opinii do moderacji." 
    });
  }
};