import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { cardFileName } from "@/lib/cardFile";
import { fetchMemberPhoto } from "@/lib/members";

// GET /api/admin/members/:id/photo — the member's photo as a named file.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await connectDB();
    const m = await Member.findById(id).select("membershipNo photo").lean();
    if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!m.photo) return NextResponse.json({ error: "This member has no picture on record." }, { status: 404 });

    const photo = await fetchMemberPhoto(m.photo);
    return new NextResponse(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.type,
        "Content-Disposition": `attachment; filename="${cardFileName(m.membershipNo, `photo.${photo.ext}`)}"`,
        "Content-Length": String(photo.bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/members/:id/photo]", err);
    return NextResponse.json({ error: "The picture could not be downloaded. Please try again." }, { status: 502 });
  }
}
