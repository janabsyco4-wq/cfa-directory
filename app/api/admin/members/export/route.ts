import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildMembersSheet } from "@/lib/exports";

// GET /api/admin/members/export?search=&category=&status=&district= — the member data as an Excel sheet.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { file, filename } = await buildMembersSheet(req.nextUrl.searchParams);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(file.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/members/export]", err);
    return NextResponse.json({ error: "Export failed. Please try again." }, { status: 500 });
  }
}
