import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { checkPassword, findAdminByLogin, lockedMessage, recordFailure, startSession } from "@/lib/admin";
import { hashRecoveryCode, verifyTotp } from "@/lib/totp";

// Compared against when the login doesn't exist, so response time doesn't reveal valid logins.
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer-not-a-password", 12);

export async function POST(req: NextRequest) {
  try {
    const { username, password, code } = await req.json();
    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      return NextResponse.json({ error: "Enter your login and password." }, { status: 400 });
    }

    const admin = await findAdminByLogin(username);
    if (admin?.lockUntil && admin.lockUntil.getTime() > Date.now()) {
      return NextResponse.json({ error: lockedMessage(admin.lockUntil) }, { status: 429 });
    }

    const passwordOk = admin ? await checkPassword(admin, password) : await bcrypt.compare(password, DUMMY_HASH);
    if (!admin || !passwordOk) {
      if (admin) {
        await recordFailure(admin);
        if (admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
          return NextResponse.json({ error: lockedMessage(admin.lockUntil) }, { status: 429 });
        }
      }
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    if (admin.mfaEnabled) {
      const token = typeof code === "string" ? code.trim() : "";
      if (!token) return NextResponse.json({ mfaRequired: true });

      if (!verifyTotp(admin.mfaSecret, token)) {
        // Fall back to a single-use recovery code.
        const hash = hashRecoveryCode(token);
        if (!admin.recoveryCodes.includes(hash)) {
          await recordFailure(admin);
          const locked = admin.lockUntil && admin.lockUntil.getTime() > Date.now();
          return NextResponse.json(
            locked ? { error: lockedMessage(admin.lockUntil!) } : { mfaRequired: true, error: "That code is not valid. Try again." },
            { status: locked ? 429 : 401 }
          );
        }
        admin.recoveryCodes = admin.recoveryCodes.filter((h) => h !== hash);
      }
    }

    admin.failedLogins = 0;
    admin.lockUntil = undefined;
    await admin.save();
    await startSession(admin);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
