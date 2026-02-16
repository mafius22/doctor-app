import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import * as AdminController from "../controllers/admin.controller";

const router = Router();

// Zabezpieczenie CAŁEGO routera (wszystkie poniższe trasy wymagają bycia Adminem)
router.use(requireAuth, requireRole("ADMIN"));

// Ustawienia
router.get("/settings", AdminController.getSettings);
router.patch("/settings/auth-persistence", AdminController.updateAuthPersistence);

// Zarządzanie lekarzami
router.post("/doctors", AdminController.createDoctor);

// Zarządzanie użytkownikami (Banowanie)
router.get("/users", AdminController.getUsers); // Lista userów
router.patch("/users/:userId/ban", AdminController.banUser); // Ban/Unban

router.get("/reviews/all", AdminController.getAllReviews);
router.delete("/reviews/:reviewId", AdminController.deleteReview);

export default router;