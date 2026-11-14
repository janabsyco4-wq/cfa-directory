import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  // Fonts and artwork read from disk by the card, certificate, notification and form renderers.
  outputFileTracingIncludes: {
    "/api/cards/*": ["./assets/**/*"],
    "/api/certificates/*": ["./assets/**/*"],
    "/api/notifications/*": ["./assets/**/*"],
    "/api/admin/forms/*": ["./assets/**/*"],
  },
  // The vector PDF writer loads its own files at runtime, so it runs from node_modules unbundled.
  serverExternalPackages: ["pdfkit", "svg-to-pdfkit"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
