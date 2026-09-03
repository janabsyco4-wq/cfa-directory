import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const validUser = process.env.ADMIN_USERNAME;
    const validPass = process.env.ADMIN_PASSWORD;

    if (username !== validUser || password !== validPass) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const session = await getSession();
    session.isLoggedIn = true;
    session.username = username;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
