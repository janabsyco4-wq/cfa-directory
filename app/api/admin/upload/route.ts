import { NextResponse } from "next/server";
import { isCloudinaryConfigured, getPhotoUploadSignature } from "@/lib/cloudinary";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Photo storage is not set up: add real CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the server environment." },
      { status: 503 }
    );
  }

  try {
    return NextResponse.json(getPhotoUploadSignature(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[upload-signature]", err);
    return NextResponse.json({ error: "Could not authorize photo upload. Please try again." }, { status: 500 });
  }
}
