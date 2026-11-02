import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { SITE_URL } from "@/lib/site";

// Rebuilt hourly so new members appear without a redeploy.
export const revalidate = 3600;

const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/",           priority: 1.0, changeFrequency: "daily" },
  { path: "/members",    priority: 0.9, changeFrequency: "daily" },
  { path: "/verify",     priority: 0.8, changeFrequency: "monthly" },
  { path: "/about",      priority: 0.7, changeFrequency: "monthly" },
  { path: "/leadership", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact",    priority: 0.6, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = PAGES.map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified: now, ...p }));

  try {
    await connectDB();
    const members = await Member.find({ status: "Active" }).select("_id updatedAt photo").sort({ joinedDate: -1 }).lean();
    return [
      ...pages,
      ...members.map((m) => ({
        url: `${SITE_URL}/members/${m._id}`,
        lastModified: (m as { updatedAt?: Date }).updatedAt ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.5,
        images: m.photo ? [m.photo.startsWith("http") ? m.photo : `${SITE_URL}${encodeURI(m.photo)}`] : undefined,
      })),
    ];
  } catch {
    // Database unreachable: still publish the main pages.
    return pages;
  }
}
