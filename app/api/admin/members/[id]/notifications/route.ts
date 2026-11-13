import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { revalidateMemberPages } from "@/lib/members";
import { HONORIFICS, notificationList, notificationNumber, RELATIONS, type NotificationInput } from "@/lib/notifications";
import { tidyText } from "@/lib/textCase";

const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const text = (v: unknown, max: number) => (typeof v === "string" ? tidyText(v).slice(0, max) : "");

/** Next number in the issuing year's sequence, e.g. CFAP/NTF/2026/0008. */
async function nextNumber(year: number) {
  const prefix = notificationNumber(year, 0).slice(0, -4);
  const [top] = await Member.aggregate<{ number: string }>([
    { $match: { "notifications.number": { $regex: `^${prefix.replace(/\//g, "\\/")}` } } },
    { $unwind: "$notifications" },
    { $match: { "notifications.number": { $regex: `^${prefix.replace(/\//g, "\\/")}` } } },
    { $project: { number: "$notifications.number" } },
    { $sort: { number: -1 } },
    { $limit: 1 },
  ]);
  return notificationNumber(year, (top ? Number(top.number.slice(prefix.length)) || 0 : 0) + 1);
}

// POST /api/admin/members/:id/notifications — issue a notification to this member.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Partial<NotificationInput> | null;
  const post = text(body?.post, 120);
  if (!post) return NextResponse.json({ error: "Enter the post this member is notified as." }, { status: 400 });
  if (!isDay(body?.from) || !isDay(body?.to)) return NextResponse.json({ error: "Enter both dates of the period." }, { status: 400 });
  if (body.to < body.from) return NextResponse.json({ error: "The period must end after it starts." }, { status: 400 });
  const relation = RELATIONS.includes(body.relation as never) ? body.relation! : "S/O";
  const honorific = HONORIFICS.includes(body.honorific as never) ? body.honorific! : "";

  try {
    await connectDB();
    const now = new Date();
    const number = await nextNumber(Number(now.toLocaleString("en-GB", { year: "numeric", timeZone: "Asia/Karachi" })));
    const member = await Member.findByIdAndUpdate(
      id,
      {
        $push: {
          notifications: {
            number, honorific, relation, post,
            relativeName: text(body.relativeName, 80),
            unit: text(body.unit, 80),
            // Dates are calendar days; noon UTC keeps them on the same day in Pakistan.
            from: new Date(`${body.from}T12:00:00Z`),
            to: new Date(`${body.to}T12:00:00Z`),
            issuedAt: now,
          },
        },
      },
      { new: true, runValidators: true },
    ).select("notifications").lean();
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidateMemberPages(id);
    return NextResponse.json({ notifications: notificationList(member.notifications), number });
  } catch (err) {
    console.error("[POST notifications]", err);
    return NextResponse.json({ error: "The notification could not be saved. Please try again." }, { status: 500 });
  }
}
