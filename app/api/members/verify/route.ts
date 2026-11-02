import { NextRequest, NextResponse } from "next/server";
import { findForVerification } from "@/lib/verification";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const by = body?.type === "cnic" ? "cnic" : "card";
  const value = typeof body?.value === "string" ? body.value.slice(0, 40) : "";

  try {
    const member = await findForVerification(by, value);
    if (member === undefined) {
      return NextResponse.json(
        { error: by === "cnic" ? "Enter a valid CNIC in the format XXXXX-XXXXXXX-X." : "Enter a membership card number." },
        { status: 400 }
      );
    }
    if (!member) return NextResponse.json({ error: "No matching membership record found." }, { status: 404 });
    return NextResponse.json({ member }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[POST /api/members/verify]", err);
    return NextResponse.json({ error: "Verification is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
