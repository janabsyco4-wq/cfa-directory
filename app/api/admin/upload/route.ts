import { NextRequest, NextResponse } from "next/server";
import { isCloudinaryConfigured, getPhotoUploadSignature, type UploadKind } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin";

const KINDS: UploadKind[] = ["photo", "card", "brand"];

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Photo storage is not set up: add real CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the server environment." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const kind: UploadKind = KINDS.includes(body?.kind) ? body.kind : "photo";

  try {
    return NextResponse.json(getPhotoUploadSignature(kind), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[upload-signature]", err);
    return NextResponse.json({ error: "Could not authorize photo upload. Please try again." }, { status: 500 });
  }
}
