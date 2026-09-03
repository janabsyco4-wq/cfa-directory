import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";

/**
 * GET /api/stats
 * Returns aggregate counts used on the homepage.
 */
export async function GET() {
  try {
    await connectDB();

    const [total, byCategory] = await Promise.all([
      Member.countDocuments({ status: "Active" }),
      Member.aggregate([
        { $match: { status: "Active" } },
        { $group: { _id: "$membershipCategory", count: { $sum: 1 } } },
      ]),
    ]);

    const categories: Record<string, number> = {};
    for (const row of byCategory) {
      categories[row._id as string] = row.count as number;
    }

    return NextResponse.json({ total, categories });
  } catch (err) {
    console.error("[GET /api/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
