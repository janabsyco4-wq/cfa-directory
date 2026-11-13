import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { normalizeFrame } from "@/lib/photoFrame";
import { memberSaveError, revalidateMemberPages } from "@/lib/members";
import { cardNumberQuery } from "@/lib/verification";

// GET single member
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const member = await Member.findById(id).lean();
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT update member
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    if (body.photoFrame) body.photoFrame = normalizeFrame(body.photoFrame);
    // Notifications have their own endpoints; the form posts back a copy that may be stale.
    delete body.notifications;

    // Check duplicate membershipNo (ignoring spacing/punctuation) or CNIC on OTHER documents; blank values are not identifiers.
    const keys = [
      body.membershipNo && (cardNumberQuery(body.membershipNo) ?? { membershipNo: body.membershipNo }),
      body.cnic && { cnic: body.cnic },
    ].filter(Boolean);
    const conflict = keys.length && await Member.findOne({ _id: { $ne: id }, $or: keys });
    if (conflict) {
      return NextResponse.json(
        { error: "Another member with this Membership No or CNIC already exists." },
        { status: 409 }
      );
    }

    const member = await Member.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidateMemberPages(id);
    return NextResponse.json({ member });
  } catch (err: unknown) {
    const { error, status } = memberSaveError(err);
    return NextResponse.json({ error }, { status });
  }
}

// PATCH membership card images only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, string> = {};
    for (const side of ["cardFront", "cardBack"] as const) {
      if (!(side in body)) continue;
      const url = body[side];
      if (url !== "" && !(typeof url === "string" && url.startsWith("https://res.cloudinary.com/"))) {
        return NextResponse.json({ error: "Invalid card image." }, { status: 400 });
      }
      update[side] = url;
    }

    const member = await Member.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select("cardFront cardBack")
      .lean();
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const member = await Member.findByIdAndDelete(id);
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidateMemberPages(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
