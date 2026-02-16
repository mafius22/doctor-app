import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { Server } from "socket.io"; 

import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import doctorsRoutes from "./routes/doctors.routes";
import doctorRoutes from "./routes/doctor.routes";
import slotsRoutes from "./routes/slots.routes";
import appointmentsRoutes from "./routes/appointments.routes";
import reviewsRoutes from "./routes/reviews.routes";

async function start() {
  const app = express();
  
  const server = http.createServer(app);

  app.use(express.json());
  app.use(cookieParser());

  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  app.use(
    cors({
      origin: clientOrigin,
      credentials: true
    })
  );

  const io = new Server(server, {
    cors: {
      origin: clientOrigin,
      credentials: true
    }
  });

  app.set("socketio", io);

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/doctors", doctorsRoutes);
  app.use("/api/doctor", doctorRoutes);
  app.use("/api", slotsRoutes);
  app.use("/api", appointmentsRoutes);
  app.use("/api", reviewsRoutes);

  const uri = process.env.MONGO_URI || "mongodb+srv://mateuszdzialowski6_db_user:bnfH7Lycl7l0t2V2@medical-consultations.unn60rc.mongodb.net/?appName=medical-consultations";
  if (!uri) throw new Error("Brak MONGO_URI w backend/.env");

  await mongoose.connect(uri);
  console.log("MongoDB connected");

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  const port = Number(process.env.PORT ?? 4000);
  
  server.listen(port, () => console.log(`API running: http://localhost:${port}`));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});