import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();

    const [total, active, inactive, pending, byCategory, recent] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: "Active" }),
      Member.countDocuments({ status: "Inactive" }),
      Member.countDocuments({ status: "Pending" }),
      Member.aggregate([
        { $group: { _id: "$membershipCategory", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Member.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("firstName lastName membershipCategory status photo joinedDate membershipNo")
        .lean(),
    ]);

    const categories: Record<string, number> = {};
    for (const row of byCategory) categories[row._id] = row.count;

    return NextResponse.json({ total, active, inactive, pending, categories, recent });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
