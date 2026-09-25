import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";

export const revalidate = 300; // Cache for 5 minutes

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

    return NextResponse.json(
      { total, categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err) {
    console.error("[GET /api/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
