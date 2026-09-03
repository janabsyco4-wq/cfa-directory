import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { getSession } from "@/lib/session";

// GET — paginated member list for admin table
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search   = (searchParams.get("search") ?? "").trim();
    const category = searchParams.get("category") ?? "";
    const status   = searchParams.get("status") ?? "";
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (category && category !== "All") query.membershipCategory = category;
    if (status   && status   !== "All") query.status = status;
    if (search) {
      query.$or = [
        { firstName:    { $regex: search, $options: "i" } },
        { lastName:     { $regex: search, $options: "i" } },
        { membershipNo: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { cnic:         { $regex: search, $options: "i" } },
      ];
    }

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
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await req.json();

    // Check duplicate membershipNo or CNIC
    const existing = await Member.findOne({
      $or: [{ membershipNo: body.membershipNo }, { cnic: body.cnic }],
    });
    if (existing) {
      return NextResponse.json(
        { error: "A member with this Membership No or CNIC already exists." },
        { status: 409 }
      );
    }

    const member = await Member.create(body);
    return NextResponse.json({ member }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
