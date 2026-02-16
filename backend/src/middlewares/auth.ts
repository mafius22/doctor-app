import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../models/User";

export type AuthUser = { userId: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith("Bearer ")) return res.status(401).json({ message: "Missing token" });

  const token = hdr.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
