import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPictureList } from "@/lib/exports";

// GET /api/admin/exports/photos[?district=&district=] — the file names and addresses for the pictures ZIP.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json(await getPictureList(req.nextUrl.searchParams), { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[GET /api/admin/exports/photos]", err);
    return NextResponse.json({ error: "Could not load the picture list." }, { status: 500 });
  }
}
