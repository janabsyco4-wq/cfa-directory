import type { UploadKind } from "@/lib/cloudinary";

/**
 * Uploads straight from the browser to Cloudinary with a server-issued signature;
 * going direct avoids the hosting platform's request-body limit. Returns the secure URL.
 */
export async function uploadImage(file: File, kind: UploadKind = "photo"): Promise<string> {
  const authorization = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  const signed = await authorization.json().catch(() => null);
  if (!authorization.ok || !signed?.signature) {
    throw new Error(signed?.error ?? "Could not authorize the upload. Please sign in and try again.");
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", signed.apiKey);
  fd.append("signature", signed.signature);
  for (const [key, value] of Object.entries(signed.params)) {
    fd.append(key, String(value));
  }
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`, {
    method: "POST", body: fd,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.secure_url) {
    throw new Error(json?.error?.message ?? "Upload failed. Please try again.");
  }
  return json.secure_url;
}
