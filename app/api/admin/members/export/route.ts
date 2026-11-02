import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { adminMemberQuery } from "@/lib/members";
import { effectiveStatus } from "@/lib/verification";
import { buildXlsx, type XlsxColumn } from "@/lib/xlsx";
import { SITE_URL } from "@/lib/site";

// GET /api/admin/members/export?search=&category=&status=&card= — every field as an Excel sheet.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const members = await Member.find(adminMemberQuery(req.nextUrl.searchParams)).sort({ membershipNo: 1 }).lean();

    const day = (d?: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");
    const abs = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `${SITE_URL}${encodeURI(u)}`);

    const columns: XlsxColumn[] = [
      { header: "Membership No", width: 22 }, { header: "First Name", width: 16 }, { header: "Last Name", width: 20 },
      { header: "Father's Name", width: 20 }, { header: "Designation", width: 30 }, { header: "Department", width: 22 },
      { header: "Category", width: 16 }, { header: "Status", width: 10 }, { header: "Valid Today", width: 12 },
      { header: "Joined", width: 12 }, { header: "Expiry", width: 12 }, { header: "CNIC", width: 17 },
      { header: "Mobile", width: 24 }, { header: "WhatsApp", width: 16 }, { header: "Email", width: 28 },
      { header: "NTN", width: 14 }, { header: "Address", width: 40 }, { header: "District", width: 16 },
      { header: "Organization", width: 34 }, { header: "Business Type", width: 20 }, { header: "Fee", width: 8 },
      { header: "Photo", width: 40 }, { header: "Card Front", width: 40 }, { header: "Card Back", width: 40 },
      { header: "Verification Link", width: 44 }, { header: "Added", width: 12 }, { header: "Updated", width: 12 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = members.map((m: any) => [
      m.membershipNo, m.firstName, m.lastName, m.fatherName, m.designation, m.department,
      m.membershipCategory, m.status, effectiveStatus(m.status, m.expiryDate) === "Active" ? "Yes" : "No",
      day(m.joinedDate), day(m.expiryDate), m.cnic, m.phone, m.whatsapp, m.email,
      m.ntn, m.address, m.district, m.businessName, m.businessType, m.fee ?? "",
      abs(m.photo), abs(m.cardFront), abs(m.cardBack), `${SITE_URL}/verify/${m._id}`,
      day(m.createdAt), day(m.updatedAt),
    ]);

    const file = buildXlsx("Members", columns, rows);
    const filename = `cfa-members-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
