import type { NextConfig } from "next";
import { PARTNER_HOSTS } from "./src/config/partners";

// Partner hosts get their landing page at "/"; every other host keeps the default rule below.
const partnerHomeRules = Object.entries(PARTNER_HOSTS).map(([host, p]) => ({
  source: "/",
  has: [{ type: "host" as const, value: host.replace(/\./g, "\\.") }],
  destination: `/partners/template.html?p=${p.id}`,
}));

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        ...partnerHomeRules,
        { source: '/', destination: '/preview/home-v2.html' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
