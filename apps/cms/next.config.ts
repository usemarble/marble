import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@marble/db", "@marble/ui"],
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
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        hostname: "images.marblecms.com",
      },
    ],
    qualities: [20, 40, 60, 80, 100],
  },
};

export default nextConfig;
