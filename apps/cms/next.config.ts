import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@marble/db", "@marble/ui", "@marble/parser"],
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  async redirects() {
    return [
      {
        source: "/settings",
        destination: "/settings/general",
        permanent: true,
      },
      {
        source: "/settings/",
        destination: "/settings/general",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.marblecms.com",
      },
      {
        protocol: "https",
        hostname: "media.marblecms.com",
      },
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
        pathname: "/ip3/**",
      },
    ],
    qualities: [20, 40, 60, 80, 100],
  },
};

export default withWorkflow(nextConfig);
