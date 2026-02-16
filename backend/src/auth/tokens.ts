import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Role } from "../models/User";

export function signAccessToken(payload: { userId: string; role: Role }) {
  const ttl = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 60);
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET || "change_me_access_secret", { expiresIn: ttl });
}

export function makeRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashRefreshToken(refreshToken: string) {
  return crypto
    .createHmac("sha256", process.env.REFRESH_TOKEN_SECRET || "change_me_refresh_secret")
    .update(refreshToken)
    .digest("hex");
}
