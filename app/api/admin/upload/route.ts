import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

    // Validate type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WEBP, or AVIF images are allowed." }, { status: 400 });
    }

    // Max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    const filename = `member_${Date.now()}`;
    const url      = await uploadToCloudinary(buffer, filename);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
