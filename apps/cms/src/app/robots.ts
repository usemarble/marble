import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "*",
      allow: ["/login", "/register"],
    },
    host: process.env.NEXT_PUBLIC_APP_URL,
  };
}
