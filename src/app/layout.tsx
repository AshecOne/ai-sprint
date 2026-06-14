import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AquaSim — Pixel Aquarium Simulator",
  description:
    "A real-time aquarium simulation game. Manage water chemistry, fish, plants, and equipment in a pixel-art tank.",
  icons: {
    icon: "/favicon.svg",
  },
};

// `viewport-fit=cover` is required for `env(safe-area-inset-*)` to report
// real values, so the mobile bottom nav clears notches / gesture bars.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
