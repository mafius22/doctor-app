import { Request, Response } from "express";
import { z } from "zod";
import { Appointment } from "../models/Appointment";
import { Review } from "../models/Review";
import { User } from "../models/User";

export const addReview = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.isBannedFromReviews) return res.status(403).json({ message: "Banned from reviews" });

    const schema = z.object({
      doctorId: z.string().min(1),
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const { doctorId, rating, comment } = parsed.data;

    const visit = await Appointment.findOne({ doctorId, patientUserId: req.user!.userId, status: "COMPLETED" });
    if (!visit) return res.status(403).json({ message: "Visit not completed or not found" });

    const existing = await Review.findOne({ doctorId, authorUserId: req.user!.userId });
    if (existing) return res.status(409).json({ message: "Already reviewed" });

    const review = await Review.create({ doctorId, authorUserId: req.user!.userId, rating, comment });
    return res.json({ id: String(review._id) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error" });
  }
};

export const replyToReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reply } = z.object({ reply: z.string().min(2) }).parse(req.body);
    
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const me = await User.findById(req.user!.userId);
    const myDoctorId = me?.doctorProfileId ? String(me.doctorProfileId) : null;

    if (!myDoctorId || String(review.doctorId) !== myDoctorId) {
      return res.status(403).json({ message: "Not your review" });
    }

    review.doctorReply = reply;
    review.doctorReplyAt = new Date();
    await review.save();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: "Error" });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const reviews = await Review.find({ doctorId }).sort({ createdAt: -1 }).populate("authorUserId", "displayName");
    
    const result = reviews.map(r => ({
      id: String(r._id),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      authorName: (r.authorUserId as any)?.displayName || "Anonymous",
      doctorReply: r.doctorReply,
      doctorReplyAt: r.doctorReplyAt
    }));
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ message: "Error" });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  await Review.findByIdAndDelete(req.params.reviewId);
  return res.json({ ok: true });
};