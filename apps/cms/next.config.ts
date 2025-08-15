import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@marble/db", "@marble/ui"],
  rewrites: async () => {
    return [
      {
        source: "/:workspace",
        destination: "/:workspace/posts",
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
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        hostname: "images.marblecms.com",
      },
    ],
  },
};

export default nextConfig;
