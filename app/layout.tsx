import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const metadataBase = new URL(
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
);

export const metadata: Metadata = {
  metadataBase,
  title: "SYMPOSIUM",
  description:
    "A first public world for living inquiry: papers, thoughts, objections, forks, tests, notebooks, and AI-assisted exploration.",
  openGraph: {
    title: "SYMPOSIUM",
    description:
      "A Greco-futurist public prototype for living inquiry and scientific exploration.",
    images: ["/symposium-arrival.jpg"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e1b1d"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
