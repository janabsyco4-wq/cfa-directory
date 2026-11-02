import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CFA Pakistan — Member Portal",
    short_name: "CFA Pakistan",
    description: "Member directory and membership verification for the Chamber of Food and Agriculture Pakistan.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f5",
    theme_color: "#103b2b",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
