import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { DEMO_MEMBERS } from "@/lib/demoMembers";

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
    await connectDB();

    // Normalize CNIC — strip dashes for flexible matching
    const cnicStripped = q.replace(/-/g, "");
    // Format with dashes if 13 digits: 12345-1234567-1
    const cnicFormatted = cnicStripped.length === 13
      ? `${cnicStripped.slice(0,5)}-${cnicStripped.slice(5,12)}-${cnicStripped.slice(12)}`
      : null;

    const member = await Member.findOne({
      $or: [
        { cnic: q },
        { cnic: cnicStripped },
        ...(cnicFormatted ? [{ cnic: cnicFormatted }] : []),
      ],
    }).lean();

    if (!member) {
      return NextResponse.json(
        { error: "No member found with the provided Membership Number or CNIC." },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });

  } catch {
    // ── MongoDB unavailable — search demo data ─────────────────────────────
    const member = DEMO_MEMBERS.find(
      (m) =>
        m.membershipNo.toLowerCase() === q.toLowerCase() ||
        m.cnic === q
    );

    if (!member) {
      return NextResponse.json(
        { error: "No member found with the provided Membership Number or CNIC." },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });
  }
}
