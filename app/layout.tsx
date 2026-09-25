import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CFA Pakistan — Chamber of Food and Agriculture",
    template: "%s | CFA Pakistan",
  },
  description:
    "Chamber of Food and Agriculture Pakistan unites farmers, agribusinesses, exporters, and policymakers to promote sustainable agriculture, food security, and market development across Pakistan.",
  keywords: [
    "CFA Pakistan",
    "Chamber of Food and Agriculture",
    "Pakistan agriculture",
    "farming Pakistan",
    "agribusiness Pakistan",
    "food security",
    "agricultural exports",
    "farmer network",
    "agriculture chamber",
    "sustainable farming Pakistan",
  ],
  authors: [{ name: "CFA Pakistan" }],
  creator: "Chamber of Food and Agriculture Pakistan",
  publisher: "CFA Pakistan",
  metadataBase: new URL("https://cfa-directory.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://cfa-directory.vercel.app",
    siteName: "CFA Pakistan",
    title: "CFA Pakistan — Chamber of Food and Agriculture",
    description:
      "Chamber of Food and Agriculture Pakistan unites farmers, agribusinesses, exporters, and policymakers to build a prosperous agricultural future.",
    images: [
      {
        url: "/logo.avif",
        width: 1200,
        height: 630,
        alt: "CFA Pakistan Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CFA Pakistan — Chamber of Food and Agriculture",
    description:
      "Empowering Farmers, Feeding the Future. Official member directory of Chamber of Food and Agriculture Pakistan.",
    images: ["/logo.avif"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code", // Replace with actual code
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
