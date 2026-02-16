import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import * as DoctorController from "../controllers/doctor.controller";

const router = Router();
router.use(requireAuth, requireRole("DOCTOR"));

router.get("/me", DoctorController.getMe);
router.post("/availability", DoctorController.addAvailability);
router.get("/availability", DoctorController.getAvailability);
router.post("/absences", DoctorController.addAbsence);
router.get("/absences", DoctorController.getAbsences);
router.patch(
  "/appointments/:appointmentId/complete", 
  DoctorController.completeAppointment
);

export default router;