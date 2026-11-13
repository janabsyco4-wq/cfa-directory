import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { revalidateMemberPages } from "@/lib/members";
import { notificationList } from "@/lib/notifications";

// DELETE /api/admin/members/:id/notifications/:nid — withdraw a notification; it leaves the verification page.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; nid: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, nid } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(nid)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await connectDB();
    const member = await Member.findByIdAndUpdate(id, { $pull: { notifications: { _id: nid } } }, { new: true })
      .select("notifications")
      .lean();
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidateMemberPages(id);
    return NextResponse.json({ notifications: notificationList(member.notifications) });
  } catch (err) {
    console.error("[DELETE notification]", err);
    return NextResponse.json({ error: "The notification could not be removed. Please try again." }, { status: 500 });
  }
}
