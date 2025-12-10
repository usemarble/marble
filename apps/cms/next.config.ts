import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@marble/db",
    "@marble/ui",
    "@marble/parser",
    "@marble/email",
  ],
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
    ],
    qualities: [20, 40, 60, 80, 100],
  },
};

export default nextConfig;
