/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["@repo/ui"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
