import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AquaSim — Pixel Aquarium Simulator",
  description:
    "A real-time aquarium simulation game. Manage water chemistry, fish, plants, and equipment in a pixel-art tank.",
  icons: {
    icon: "/favicon.svg",
  },
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
