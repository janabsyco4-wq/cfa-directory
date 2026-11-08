import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { normalizeFrame } from "@/lib/photoFrame";
import { adminMemberQuery, memberSaveError, revalidateMemberPages } from "@/lib/members";
import { districtOptions } from "@/lib/districts";
import { formatMemberNo } from "@/lib/memberNumber";
import { cardNumberQuery } from "@/lib/verification";

// GET — paginated member list for admin table
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const query    = adminMemberQuery(searchParams);

    const [total, members, districts] = await Promise.all([
      Member.countDocuments(query),
      Member.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Member.distinct("district"),
    ]);

    return NextResponse.json({ members, total, page, totalPages: Math.ceil(total / limit), districts: districtOptions(districts) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — create new member
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await req.json();
    if (body.photoFrame) body.photoFrame = normalizeFrame(body.photoFrame);
    body.membershipNo = formatMemberNo(String(body.membershipNo ?? ""));
    if (!body.membershipNo) return NextResponse.json({ error: "Membership No is required." }, { status: 400 });

    // Check duplicate membershipNo (ignoring spacing/punctuation) or CNIC; blank values are not identifiers.
    const keys = [
      cardNumberQuery(body.membershipNo) ?? { membershipNo: body.membershipNo },
      body.cnic && { cnic: body.cnic },
    ].filter(Boolean);
    const existing = keys.length && await Member.findOne({ $or: keys });
    if (existing) {
      return NextResponse.json(
        { error: "A member with this Membership No or CNIC already exists." },
        { status: 409 }
      );
    }

    const member = await Member.create(body);
    revalidateMemberPages(String(member._id));
    return NextResponse.json({ member }, { status: 201 });
  } catch (err: unknown) {
    const { error, status } = memberSaveError(err);
    return NextResponse.json({ error }, { status });
  }
}
