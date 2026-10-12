import type { NextConfig } from "next";

const noCache = [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      { source: "/", headers: noCache },
      { source: "/stella/:path*", headers: noCache },
      { source: "/3d", headers: noCache },
      { source: "/3d/:path*", headers: noCache },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "roomba-dashboard.vercel.app" }],
        destination: "https://stella.kingsharif.com/:path*",
        permanent: false,
      },
      { source: "/stella", destination: "/stella/index.html", permanent: false },
    ];
  },
  async rewrites() {
    return [
      // Grok's engineering-paper landing page serves at the root.
      { source: "/", destination: "/stella/index.html" },
      // One viewer: the Anatomy page, also at /3d (embed uses /3d?embed).
      { source: "/3d", destination: "/3d/index.html" },
    ];
  },
};

export default nextConfig;
