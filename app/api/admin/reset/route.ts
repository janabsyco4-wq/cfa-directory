import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { findAdminByLogin, hashPassword, isLocked, lockedMessage, passwordProblem, recordFailure } from "@/lib/admin";

// Owner-only password reset. There is no email service, so proof of ownership is a code the owner
// puts in the server environment (ADMIN_RESET_CODE on Vercel). Without that variable, reset is off.
const MIN_CODE_LENGTH = 16;

function resetCode() {
  const code = process.env.ADMIN_RESET_CODE?.trim() ?? "";
  return code.length >= MIN_CODE_LENGTH ? code : null;
}

function sameCode(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function GET() {
  return NextResponse.json({ enabled: !!resetCode(), minLength: MIN_CODE_LENGTH }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const expected = resetCode();
  if (!expected) {
    return NextResponse.json({ error: "Password reset is switched off. Follow the steps on this page to switch it on.", enabled: false }, { status: 403 });
  }

  try {
    const body = await req.json();
    const login = typeof body.login === "string" ? body.login.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (!login || !code || !newPassword) return NextResponse.json({ error: "Fill in every field." }, { status: 400 });

    const admin = await findAdminByLogin(login);
    if (admin && isLocked(admin)) return NextResponse.json({ error: lockedMessage(admin.lockUntil!) }, { status: 429 });

    if (!admin || !sameCode(code, expected)) {
      if (admin) {
        await recordFailure(admin);
        if (isLocked(admin)) return NextResponse.json({ error: lockedMessage(admin.lockUntil!) }, { status: 429 });
      }
      return NextResponse.json({ error: "The login email or reset code is incorrect." }, { status: 401 });
    }

    const problem = passwordProblem(newPassword);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    admin.passwordHash = await hashPassword(newPassword);
    admin.sessionVersion += 1;          // signs out every existing session
    admin.failedLogins = 0;
    admin.lockUntil = undefined;
    if (body.disableMfa === true) {     // for a lost authenticator phone
      admin.mfaEnabled = false;
      admin.mfaSecret = "";
      admin.recoveryCodes = [];
    }
    await admin.save();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
