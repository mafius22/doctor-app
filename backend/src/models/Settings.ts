import { Schema, model } from "mongoose";

export type AuthPersistenceMode = "LOCAL" | "SESSION" | "NONE";

interface ISettings {
  authPersistence: AuthPersistenceMode;
}

const SettingsSchema = new Schema<ISettings>(
  {
    authPersistence: { type: String, enum: ["LOCAL", "SESSION", "NONE"], default: "LOCAL" }
  },
  { timestamps: true }
);

export const Settings = model<ISettings>("Settings", SettingsSchema);
