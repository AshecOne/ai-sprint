import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack is enabled by default in Next.js 16; no custom config required.
  turbopack: {},
};

export default nextConfig;
