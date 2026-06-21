import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cacheComponents: true,
  },
  async rewrites() {
    return [
      {
        source: "/:username([a-z0-9][a-z0-9-]{0,29}).json",
        destination: "/api/public/:username",
      },
      {
        source: "/:username([a-z0-9][a-z0-9-]{0,29}).txt",
        destination: "/api/public/:username/txt",
      },
    ];
  },
};

export default nextConfig;
