import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { normalizeFrame } from "@/lib/photoFrame";
import { escapeRegex, memberSaveError, revalidateMemberPages } from "@/lib/members";
import { formatMemberNo } from "@/lib/memberNumber";
import { cardNumberQuery } from "@/lib/verification";

// GET — paginated member list for admin table
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search   = (searchParams.get("search") ?? "").trim();
    const category = searchParams.get("category") ?? "";
    const status   = searchParams.get("status") ?? "";
    const card     = searchParams.get("card") ?? "";
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (category && category !== "All") query.membershipCategory = category;
    if (status   && status   !== "All") query.status = status;
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: "i" };
      query.$or = [
        { firstName:    rx },
        { lastName:     rx },
        { membershipNo: rx },
        { businessName: rx },
        { cnic:         rx },
      ];
    }
    // Card filter: both sides uploaded, or at least one side missing.
    const blank = { $in: ["", null] };
    if (card === "uploaded") query.$and = [{ cardFront: { $nin: ["", null] } }, { cardBack: { $nin: ["", null] } }];
    if (card === "missing")  query.$and = [{ $or: [{ cardFront: blank }, { cardBack: blank }] }];

    const total   = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ members, total, page, totalPages: Math.ceil(total / limit) });
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
