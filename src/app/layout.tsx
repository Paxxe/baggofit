import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./configurator.css";
import "./cartoon.css";
import "./cartoon-motion.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Baggofit | Find the perfect fit for your journey", template: "%s | Baggofit" },
  description: "Find the backpack capacity that fits your trip, packing list, and travel style.",
  openGraph: {
    type: "website",
    siteName: "Baggofit",
    title: "Baggofit | Find the perfect fit for your journey",
    description: "A thoughtful backpack capacity estimate for your next trip.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
