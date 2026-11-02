import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured(): boolean {
  const vals = [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ];
  return vals.every((v) => !!v && !/paste_your|your_/i.test(v));
}

export type UploadKind = "photo" | "card" | "brand";

const UPLOAD_PRESETS: Record<UploadKind, { folder: string; prefix: string; format?: string }> = {
  // Raster output keeps uncommon photo formats browser-friendly without cropping.
  photo: { folder: "cfa-members", prefix: "member", format: "webp" },
  // Finished card artwork is stored untouched so it prints at its original quality.
  card:  { folder: "cfa-cards", prefix: "card" },
  // PNG keeps logo and signature transparency.
  brand: { folder: "cfa-brand", prefix: "brand", format: "png" },
};

export function getPhotoUploadSignature(kind: UploadKind = "photo") {
  const preset = UPLOAD_PRESETS[kind];
  const params: Record<string, string | number | boolean> = {
    timestamp: Math.floor(Date.now() / 1000),
    folder: preset.folder,
    public_id: `${preset.prefix}_${randomUUID()}`,
    overwrite: false,
  };
  if (preset.format) params.format = preset.format;
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    params,
    signature: cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!),
  };
}

/**
 * Delete an image from Cloudinary by its public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
