import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { DEMO_MEMBERS } from "@/lib/demoMembers";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search   = (searchParams.get("search")   ?? "").trim();
  const category = searchParams.get("category")  ?? "";
  const district = (searchParams.get("district") ?? "").trim();
  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit    = Math.min(48, parseInt(searchParams.get("limit") ?? "24"));

  try {
    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { status: "Active" };
    if (category && category !== "All") query.membershipCategory = category;
    if (district) query.district = { $regex: `^${district}$`, $options: "i" };
    if (search) {
      query.$or = [
        { firstName:    { $regex: search, $options: "i" } },
        { lastName:     { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
      ];
    }

    // Run count + find + districts in parallel
    const [total, members, districts] = await Promise.all([
      Member.countDocuments(query),
      Member.find(query)
        .select("membershipNo firstName lastName membershipCategory photo businessName district joinedDate")
        .sort({ joinedDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Member.distinct("district", { status: "Active", district: { $nin: [null, ""] } }),
    ]);

    return NextResponse.json(
      { members, total, page, totalPages: Math.ceil(total / limit), districts: districts.sort() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );

  } catch {
    // ── MongoDB unavailable — serve demo data ──────────────────────────────
    let filtered = DEMO_MEMBERS.filter((m) => m.status === "Active");

    if (category && category !== "All") {
      filtered = filtered.filter((m) => m.membershipCategory === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q)  ||
          m.businessName.toLowerCase().includes(q)
      );
    }

    const total      = filtered.length;
    const paginated  = filtered.slice((page - 1) * limit, page * limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({ members: paginated, total, page, totalPages });
  }
}
