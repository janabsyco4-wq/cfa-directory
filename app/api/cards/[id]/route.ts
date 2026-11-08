import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { requireAdmin } from "@/lib/admin";
import { effectiveStatus } from "@/lib/verification";
import { buildCardPdf, cardFileName, fetchCardImage, pngCardImage } from "@/lib/cardFile";
import { renderCard, type CardSide } from "@/lib/cardDesign";

// GET /api/cards/:id?side=pdf|front|back[&view=1] — a member's card: uploaded artwork when
// there is some for that side, otherwise the generated design. view=1 shows it inline.
// Public for valid (Active, unexpired) memberships; admins can get any member's card.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const side = req.nextUrl.searchParams.get("side") ?? "pdf";
  const inline = req.nextUrl.searchParams.get("view") === "1";
  if (!isValidObjectId(id) || !["pdf", "front", "back"].includes(side)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const m = await Member.findById(id)
      .select("membershipNo firstName lastName membershipCategory designation joinedDate expiryDate status cardFront cardBack")
      .lean();
    if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const valid = effectiveStatus(m.status, m.expiryDate) === "Active";
    if (!valid && !(await requireAdmin())) {
      return NextResponse.json({ error: "This membership is not active, so its card can't be downloaded." }, { status: 403 });
    }

    const sides: CardSide[] = side === "pdf" ? ["front", "back"] : [side as CardSide];
    const files = await Promise.all(sides.map(async (s) => {
      const uploaded = s === "front" ? m.cardFront : m.cardBack;
      if (uploaded) {
        const img = await fetchCardImage(uploaded);
        return { bytes: img.data, type: "image/jpeg", ext: "jpg", pdf: () => img };
      }
      const png = await renderCard(s, { ...m, id: String(m._id) });
      return { bytes: png, type: "image/png", ext: "png", pdf: () => pngCardImage(png) };
    }));

    const body = side === "pdf" ? buildCardPdf(files.map((f) => f.pdf()), `Membership card ${m.membershipNo}`) : files[0].bytes;
    const filename = cardFileName(m.membershipNo, side === "pdf" ? "card.pdf" : `card-${side}.${files[0].ext}`);

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": side === "pdf" ? "application/pdf" : files[0].type,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
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
