import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { getDoctorSlots } from "../controllers/slot.controller";

const router = Router();

router.get(
  "/doctors/:doctorId/slots",
  requireAuth,
  requireRole("PATIENT", "DOCTOR", "ADMIN"),
  getDoctorSlots
);

export default router;