import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { getOrganization } from "@/lib/organization";
import { renderNotification } from "@/lib/notificationDesign";
import { docBaseName, docFormat, docResponse } from "@/lib/memberDocs";
import { toNotificationRecord } from "@/lib/notifications";

// GET /api/notifications/:id?format=pdf|png|preview[&view=1] — one issued notification.
// Public: notifications are shown on the member's verification page.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = docFormat(req.nextUrl.searchParams.get("format"));
  if (!isValidObjectId(id) || !format) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await connectDB();
    const m = await Member.findOne({ "notifications._id": id })
      .select({ membershipNo: 1, firstName: 1, lastName: 1, notifications: { $elemMatch: { _id: id } } })
      .lean();
    const n = m?.notifications?.[0];
    if (!m || !n) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const record = toNotificationRecord(n);
    const org = await getOrganization();
    const file = await renderNotification({ ...m, id: String(m._id) }, record, format, org.presidentTitle);
    const base = docBaseName(m.membershipNo, `notification-${record.number.split("/").slice(-2).join("-")}`);
    return docResponse(file, format, base, req.nextUrl.searchParams.get("view") === "1", true);
  } catch (err) {
    console.error("[GET /api/notifications/:id]", err);
    return NextResponse.json({ error: "The notification could not be prepared. Please try again." }, { status: 502 });
  }
}
