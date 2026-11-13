import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getExportSummary } from "@/lib/exports";

// GET /api/admin/exports — member and picture totals, overall and per district.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json(await getExportSummary(), { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[GET /api/admin/exports]", err);
    return NextResponse.json({ error: "Could not load export totals." }, { status: 500 });
  }
}
