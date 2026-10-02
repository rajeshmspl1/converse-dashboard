import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/preview/home-v2.html' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
