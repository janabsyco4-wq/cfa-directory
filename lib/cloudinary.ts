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

export function getPhotoUploadSignature() {
  const params = {
    timestamp: Math.floor(Date.now() / 1000),
    folder: "cfa-members",
    public_id: `member_${randomUUID()}`,
    overwrite: false,
    // Raster output keeps uncommon photo formats browser-friendly without cropping.
    format: "webp",
  };
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
