import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { ACTIVITY_REFRESH_MS, sessionExpiry } from "@/lib/sessionConfig";
import Admin, { type IAdmin } from "@/models/Admin";

export const PASSWORD_RULE = "Use at least 12 characters with upper-case, lower-case, and a number.";

export function passwordProblem(pw: string): string | null {
  if (pw.length < 12 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return PASSWORD_RULE;
  return null;
}

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export function checkPassword(admin: IAdmin, pw: string) {
  return bcrypt.compare(pw, admin.passwordHash);
}

/**
 * The first sign-in moves the .env credentials into the database; from then on the
 * password, login and MFA are managed from Profile & security and .env is ignored.
 */
async function bootstrapAdmin() {
  if (await Admin.exists({})) return;
  const login = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!login || !password) return;
  await Admin.create({ login, passwordHash: await hashPassword(password) }).catch(() => undefined);
}

export async function findAdminByLogin(login: string) {
  await connectDB();
  await bootstrapAdmin();
  return Admin.findOne({ login: login.trim().toLowerCase() });
}

/**
 * The signed-in admin, or null when signed out, idle too long, past the session limit,
 * or the session predates a password change / "sign out everywhere". Counts as activity.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;
  if (sessionExpiry(session)) {
    session.destroy();
    return null;
  }
  await connectDB();
  const admin = await Admin.findById(session.userId);
  if (!admin || admin.sessionVersion !== (session.sessionVersion ?? 0)) return null;
  if (Date.now() - session.lastSeen! > ACTIVITY_REFRESH_MS) {
    session.lastSeen = Date.now();
    await session.save();
  }
  return admin;
}

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export function lockedMessage(until: Date) {
  const mins = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000));
  return `Too many failed sign-in attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`;
}

/** Counts a failed sign-in or reset attempt; locks the account after MAX_FAILED_LOGINS. */
export async function recordFailure(admin: IAdmin) {
  admin.failedLogins = (admin.failedLogins ?? 0) + 1;
  if (admin.failedLogins >= MAX_FAILED_LOGINS) {
    admin.lockUntil = new Date(Date.now() + LOCKOUT_MS);
    admin.failedLogins = 0;
  }
  await admin.save();
}

export function isLocked(admin: IAdmin) {
  return !!admin.lockUntil && admin.lockUntil.getTime() > Date.now();
}

/** Starts a fresh session for this admin. */
export async function startSession(admin: IAdmin) {
  const session = await getSession();
  const now = Date.now();
  session.isLoggedIn = true;
  session.username = admin.login;
  session.userId = String(admin._id);
  session.sessionVersion = admin.sessionVersion;
  session.loginAt = now;
  session.lastSeen = now;
  await session.save();
}

export function publicAdmin(admin: IAdmin) {
  return {
    login: admin.login,
    name: admin.name,
    mobile: admin.mobile,
    whatsapp: admin.whatsapp,
    mfaEnabled: admin.mfaEnabled,
    recoveryCodesLeft: admin.recoveryCodes.length,
  };
}
