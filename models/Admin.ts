import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdmin extends Document {
  login: string;            // email or username used to sign in (stored lower-case)
  name: string;
  mobile: string;
  whatsapp: string;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret: string;        // base32 TOTP secret, only set while MFA is enabled
  recoveryCodes: string[];  // sha256 hashes of unused single-use codes
  sessionVersion: number;   // bumped on password/login changes to sign out other sessions
  failedLogins: number;     // consecutive failed sign-ins, reset on success
  lockUntil?: Date;         // sign-in blocked until then after too many failures
}

const AdminSchema = new Schema<IAdmin>(
  {
    login: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    mobile: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: "" },
    recoveryCodes: { type: [String], default: [] },
    sessionVersion: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0 },
    lockUntil: { type: Date, default: undefined },
  },
  { timestamps: true }
);

const Admin: Model<IAdmin> = mongoose.models.Admin ?? mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin;
