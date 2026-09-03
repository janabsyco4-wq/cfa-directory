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
    "Chamber of Food and Agriculture Pakistan — Empowering Farmers, Feeding the Future. Official member directory and verification portal.",
  keywords: ["CFA Pakistan", "food", "agriculture", "chamber", "members", "farming"],
  openGraph: {
    title: "CFA Pakistan — Chamber of Food and Agriculture",
    description: "Official member directory of the Chamber of Food and Agriculture Pakistan.",
    type: "website",
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
