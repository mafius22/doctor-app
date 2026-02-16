import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import * as AppointmentController from "../controllers/appointment.controller";

const router = Router();

router.post("/appointments/reserve", requireAuth, requireRole("PATIENT"), AppointmentController.reserveAppointment);
router.patch("/appointments/:id", requireAuth, requireRole("PATIENT"), AppointmentController.cancelAppointment);
router.post("/appointments/:appointmentId/pay", requireAuth, requireRole("PATIENT"), AppointmentController.confirmPayment);
router.get("/appointments", requireAuth, requireRole("PATIENT"), AppointmentController.getMyAppointments);

export default router;