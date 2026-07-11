import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Herramientas PropTools (HTML estático en public/tools)
      { source: "/tools/:slug", destination: "/tools/:slug/index.html" },
      { source: "/tools/:slug/", destination: "/tools/:slug/index.html" },
    ];
  },
};

export default nextConfig;
