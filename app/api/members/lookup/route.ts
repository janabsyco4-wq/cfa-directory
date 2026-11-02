import { NextRequest, NextResponse } from "next/server";
import { findForVerification } from "@/lib/verification";

// Legacy CNIC lookup kept for old links; it now returns the same public-only record as /api/members/verify.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json(
      { error: "Please provide a Membership Number or CNIC." },
      { status: 400 }
    );
  }

  try {
    const byCnic = q.replace(/\D/g, "").length === 13 && /^[\d\s-]+$/.test(q);
    const member = await findForVerification(byCnic ? "cnic" : "card", q);

    if (!member) {
      return NextResponse.json(
        { error: "No member found with the provided Membership Number or CNIC." },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });

  } catch (err) {
    console.error("[GET /api/members/lookup]", err);
    return NextResponse.json(
      { error: "Member verification is temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}
