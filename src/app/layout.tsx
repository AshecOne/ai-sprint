import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://ai-sprint-liart.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AquaSim — Pixel Aquarium Simulator",
  description:
    "A real-time aquarium simulation game. Manage water chemistry, fish, plants, and equipment in a pixel-art tank.",
  openGraph: {
    title: "AquaSim — Pixel Aquarium Simulator",
    description:
      "A real-time aquarium simulation game. Manage water chemistry, fish, plants, and equipment in a pixel-art tank.",
    url: siteUrl,
    siteName: "AquaSim",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "AquaSim — Pixel Aquarium Simulator",
    description:
      "A real-time aquarium simulation game. Manage water chemistry, fish, plants, and equipment in a pixel-art tank.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "2048x2048", type: "image/png" },
    ],
    // Reuse the high-res favicon.png as Apple touch icon (iOS scales it to 180×180).
    apple: { url: "/favicon.png", sizes: "180x180" },
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
