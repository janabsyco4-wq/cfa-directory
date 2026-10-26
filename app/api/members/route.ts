import { NextRequest, NextResponse } from "next/server";
import { queryMembers } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  try {
    const data = await queryMembers({
      search:   sp.get("search") ?? "",
      category: sp.get("category") ?? "",
      district: (sp.get("district") ?? "").trim(),
      sort:     sp.get("sort") ?? "",
      page:     parseInt(sp.get("page") ?? "1") || 1,
      limit:    parseInt(sp.get("limit") ?? "24") || 24,
    });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[GET /api/members]", err);
    return NextResponse.json(
      { error: "The member directory is temporarily unavailable. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
