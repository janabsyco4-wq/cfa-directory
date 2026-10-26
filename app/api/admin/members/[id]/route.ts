import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { getSession } from "@/lib/session";
import { normalizeFrame } from "@/lib/photoFrame";
import { revalidateMemberPages } from "@/lib/members";

// GET single member
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    if (body.photoFrame) body.photoFrame = normalizeFrame(body.photoFrame);

    // Check duplicate membershipNo/CNIC on OTHER documents; blank values are not identifiers.
    const keys = [
      body.membershipNo && { membershipNo: body.membershipNo },
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
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
