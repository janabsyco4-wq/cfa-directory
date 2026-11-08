import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildMembershipFormPdf } from "@/lib/formDesign";

// GET /api/admin/forms/membership[?member=id] — the application form as a PDF, blank or filled in.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await buildMembershipFormPdf(req.nextUrl.searchParams.get("member"));
    if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return new NextResponse(new Uint8Array(form.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${form.filename}"`,
        "Content-Length": String(form.pdf.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/forms/membership]", err);
    return NextResponse.json({ error: "The form could not be prepared. Please try again." }, { status: 502 });
  }
}
