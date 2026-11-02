import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { effectiveStatus } from "@/lib/verification";
import { buildCardPdf, cardFileName, fetchCardImage } from "@/lib/cardFile";

// GET /api/cards/:id?side=pdf|front|back — downloads a member's uploaded card.
// Public for valid (Active, unexpired) memberships; admins can download any member's card.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const side = req.nextUrl.searchParams.get("side") ?? "pdf";
  if (!isValidObjectId(id) || !["pdf", "front", "back"].includes(side)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const m = await Member.findById(id).select("membershipNo status expiryDate cardFront cardBack").lean();
    if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const valid = effectiveStatus(m.status, m.expiryDate) === "Active";
    if (!valid && !(await requireAdmin())) {
      return NextResponse.json({ error: "This membership is not active, so its card can't be downloaded." }, { status: 403 });
    }

    const urls = side === "pdf" ? [m.cardFront, m.cardBack].filter(Boolean) : [side === "front" ? m.cardFront : m.cardBack].filter(Boolean);
    if (!urls.length) return NextResponse.json({ error: "No card has been uploaded for this member yet." }, { status: 404 });

    const images = await Promise.all(urls.map((u) => fetchCardImage(u)));
    const body = side === "pdf" ? buildCardPdf(images, `Membership card ${m.membershipNo}`) : images[0].data;
    const filename = cardFileName(m.membershipNo, side === "pdf" ? "card.pdf" : `card-${side}.jpg`);

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": side === "pdf" ? "application/pdf" : "image/jpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(body.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[GET /api/cards/:id]", err);
    return NextResponse.json({ error: "The card could not be prepared. Please try again." }, { status: 502 });
  }
}
