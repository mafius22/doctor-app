import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import * as DoctorsController from "../controllers/doctors.controller";

const router = Router();

router.get("/", DoctorsController.getAllDoctors);

router.get(
  "/:doctorId/schedule",
  requireAuth,
  requireRole("PATIENT", "DOCTOR", "ADMIN"),
  DoctorsController.getDoctorScheduleRules
);


export default router;