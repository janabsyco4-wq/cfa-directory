import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary under the cfa-members folder.
 * Returns the secure URL.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "cfa-members",
        public_id: filename,
        overwrite: true,
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
