import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { effectiveStatus } from "@/lib/verification";
import { getOrganization } from "@/lib/organization";
import { renderCertificate } from "@/lib/certificateDesign";
import { docBaseName, docFormat, docResponse, docScale } from "@/lib/memberDocs";

// GET /api/certificates/:id?format=pdf|png|preview[&view=1] — a member's membership certificate,
// drawn from their record. Public for valid (Active, unexpired) memberships; admins can get any.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = docFormat(req.nextUrl.searchParams.get("format"));
  if (!isValidObjectId(id) || !format) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await connectDB();
    const m = await Member.findById(id)
      .select("membershipNo firstName lastName membershipCategory district joinedDate expiryDate status")
      .lean();
    if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (effectiveStatus(m.status, m.expiryDate) !== "Active" && !(await requireAdmin())) {
      return NextResponse.json({ error: "This membership is not active, so its certificate can't be downloaded." }, { status: 403 });
    }

    const org = await getOrganization();
    const png = await renderCertificate({ ...m, id: String(m._id) }, docScale(format), org.presidentTitle);
    return docResponse(png, format, docBaseName(m.membershipNo, "certificate"), `Membership certificate ${m.membershipNo}`, req.nextUrl.searchParams.get("view") === "1");
  } catch (err) {
    console.error("[GET /api/certificates/:id]", err);
    return NextResponse.json({ error: "The certificate could not be prepared. Please try again." }, { status: 502 });
  }
}
