import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import Admin from "@/models/Admin";
import { getSession } from "@/lib/session";
import { checkPassword, hashPassword, passwordProblem, publicAdmin, requireAdmin } from "@/lib/admin";
import { generateRecoveryCodes, generateTotpSecret, totpUri, verifyTotp } from "@/lib/totp";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return fail("Unauthorized", 401);
  return NextResponse.json({ admin: publicAdmin(admin) });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return fail("Unauthorized", 401);

  try {
    const body = await req.json();

    switch (body.intent) {
      case "profile": {
        admin.name = str(body.name).slice(0, 120);
        admin.mobile = str(body.mobile).slice(0, 30);
        admin.whatsapp = str(body.whatsapp).slice(0, 30);
        await admin.save();
        return NextResponse.json({ admin: publicAdmin(admin) });
      }

      case "password": {
        const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
        const next = typeof body.newPassword === "string" ? body.newPassword : "";
        if (!(await checkPassword(admin, current))) return fail("Current password is incorrect.");
        const problem = passwordProblem(next);
        if (problem) return fail(problem);
        if (await checkPassword(admin, next)) return fail("Choose a password different from the current one.");

        admin.passwordHash = await hashPassword(next);
        // Sign out every other session; keep this one signed in.
        admin.sessionVersion += 1;
        await admin.save();
        const session = await getSession();
        session.sessionVersion = admin.sessionVersion;
        await session.save();
        return NextResponse.json({ ok: true });
      }

      case "email": {
        const newLogin = str(body.newEmail).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLogin)) return fail("Enter a valid email address.");
        if (!(await checkPassword(admin, String(body.password ?? "")))) return fail("Current password is incorrect.");
        if (newLogin === admin.login) return fail("That is already your login email.");
        if (await Admin.exists({ login: newLogin, _id: { $ne: admin._id } })) return fail("That email is already in use.");

        admin.login = newLogin;
        await admin.save();
        const session = await getSession();
        session.username = newLogin;
        await session.save();
        return NextResponse.json({ admin: publicAdmin(admin), message: `Login email changed. Sign in with ${newLogin} from now on.` });
      }

      case "logout-others": {
        // Invalidates every other session; this one is re-stamped and stays signed in.
        admin.sessionVersion += 1;
        await admin.save();
        const session = await getSession();
        session.sessionVersion = admin.sessionVersion;
        await session.save();
        return NextResponse.json({ ok: true });
      }

      case "totp-setup": {
        if (admin.mfaEnabled) return fail("MFA is already enabled.");
        const secret = generateTotpSecret();
        const qr = await QRCode.toDataURL(totpUri(secret, admin.login, "CFA Admin"), { margin: 1, width: 220 });
        return NextResponse.json({ secret, qr });
      }

      case "totp-enable": {
        const secret = str(body.secret);
        if (admin.mfaEnabled) return fail("MFA is already enabled.");
        if (!/^[A-Z2-7]{16,}$/.test(secret)) return fail("Setup expired. Start again.");
        if (!verifyTotp(secret, str(body.code))) return fail("That code is not valid. Check your device's time and try again.");

        const { codes, hashes } = generateRecoveryCodes();
        admin.mfaEnabled = true;
        admin.mfaSecret = secret;
        admin.recoveryCodes = hashes;
        await admin.save();
        return NextResponse.json({ admin: publicAdmin(admin), recoveryCodes: codes });
      }

      case "totp-disable": {
        if (!(await checkPassword(admin, String(body.password ?? "")))) return fail("Current password is incorrect.");
        admin.mfaEnabled = false;
        admin.mfaSecret = "";
        admin.recoveryCodes = [];
        await admin.save();
        return NextResponse.json({ admin: publicAdmin(admin) });
      }

      case "recovery-regenerate": {
        if (!admin.mfaEnabled) return fail("Enable MFA first.");
        if (!(await checkPassword(admin, String(body.password ?? "")))) return fail("Current password is incorrect.");
        const { codes, hashes } = generateRecoveryCodes();
        admin.recoveryCodes = hashes;
        await admin.save();
        return NextResponse.json({ admin: publicAdmin(admin), recoveryCodes: codes });
      }

      default:
        return fail("Unknown request.");
    }
  } catch {
    return fail("Server error.", 500);
  }
}
