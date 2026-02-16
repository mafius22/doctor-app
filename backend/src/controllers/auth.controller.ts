import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { Settings, AuthPersistenceMode } from "../models/Settings";
import { signAccessToken, makeRefreshToken, hashRefreshToken } from "../auth/tokens";

const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  displayName: z.string().min(2)
});

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
});

async function getPersistenceMode(): Promise<AuthPersistenceMode> {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({ authPersistence: "LOCAL" });
  return s.authPersistence;
}

async function createSessionForUser(userId: string) {
  await Session.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
  const refreshToken = makeRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await Session.create({ userId, refreshTokenHash, expiresAt, revokedAt: null });
  return refreshToken;
}

function setRefreshCookie(res: Response, refreshToken: string, mode: "LOCAL" | "SESSION") {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/api/auth"
  };
  if (mode === "LOCAL") {
    res.cookie("refreshToken", refreshToken, { ...base, maxAge: days * 24 * 60 * 60 * 1000 });
  } else {
    res.cookie("refreshToken", refreshToken, { ...base });
  }
}

export const register = async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password, displayName } = parsed.data;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    passwordHash,
    displayName,
    role: "PATIENT",
    isBannedFromReviews: false
  });

  const accessToken = signAccessToken({ userId: String(user._id), role: user.role });
  const mode = await getPersistenceMode();
  const refreshToken = await createSessionForUser(String(user._id));

  if (mode !== "NONE") setRefreshCookie(res, refreshToken, mode);
  
  return res.json({
    accessToken,
    refreshToken: mode === "NONE" ? refreshToken : undefined,
    user: { id: String(user._id), role: user.role, displayName: user.displayName }
  });
};

export const login = async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Bad credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Bad credentials" });

  const accessToken = signAccessToken({ userId: String(user._id), role: user.role });
  const mode = await getPersistenceMode();
  const refreshToken = await createSessionForUser(String(user._id));

  if (mode !== "NONE") setRefreshCookie(res, refreshToken, mode);

  return res.json({
    accessToken,
    refreshToken: mode === "NONE" ? refreshToken : undefined,
    user: { id: String(user._id), role: user.role, displayName: user.displayName }
  });
};

export const refresh = async (req: Request, res: Response) => {
  const mode = await getPersistenceMode();
  const tokenFromCookie = req.cookies?.refreshToken as string | undefined;
  const tokenFromBody = req.body?.refreshToken as string | undefined;
  const refreshToken = mode === "NONE" ? tokenFromBody : tokenFromCookie;

  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

  const refreshTokenHash = hashRefreshToken(refreshToken);
  const session = await Session.findOne({ refreshTokenHash, revokedAt: null });
  
  if (!session) return res.status(401).json({ message: "Invalid refresh token" });
  if (session.expiresAt.getTime() < Date.now()) return res.status(401).json({ message: "Refresh expired" });

  const user = await User.findById(session.userId);
  if (!user) return res.status(401).json({ message: "User not found" });

  session.revokedAt = new Date();
  await session.save();

  const newRefresh = await createSessionForUser(String(user._id));
  const accessToken = signAccessToken({ userId: String(user._id), role: user.role });

  if (mode !== "NONE") setRefreshCookie(res, newRefresh, mode);

  return res.json({
    accessToken,
    refreshToken: mode === "NONE" ? newRefresh : undefined,
    user: { id: String(user._id), role: user.role, displayName: user.displayName }
  });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (token) {
    const h = hashRefreshToken(token);
    await Session.updateMany({ refreshTokenHash: h, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }
  res.clearCookie("refreshToken", { path: "/api/auth" });
  return res.json({ ok: true });
};