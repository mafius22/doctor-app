import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import * as ReviewController from "../controllers/review.controller";

const router = Router();

router.post("/reviews", requireAuth, requireRole("PATIENT"), ReviewController.addReview);
router.post("/reviews/:reviewId/reply", requireAuth, requireRole("DOCTOR"), ReviewController.replyToReview);
router.get("/doctors/:doctorId/reviews", ReviewController.getReviews);
router.delete("/reviews/:reviewId", requireAuth, requireRole("ADMIN"), ReviewController.deleteReview);

export default router;