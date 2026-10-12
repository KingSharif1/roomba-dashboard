import type { NextConfig } from "next";

const noCache = [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      { source: "/stella/:path*", headers: noCache },
      { source: "/3d/:path*", headers: noCache },
    ];
  },
  async redirects() {
    return [{ source: "/stella", destination: "/stella/index.html", permanent: false }];
  },
};

export default nextConfig;
