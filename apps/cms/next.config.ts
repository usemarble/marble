import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@marble/db", "@marble/ui", "@marble/parser"],
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

export default withSentryConfig(nextConfig, {
  org: "marble-cms",
  project: "dashboard",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: process.env.NODE_ENV === "production",
  automaticVercelMonitors: true,
});
