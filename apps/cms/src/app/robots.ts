import type { MetadataRoute } from "next";
import { env } from "@/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "*",
      allow: ["/login", "/register"],
    },
    host: env.NEXT_PUBLIC_APP_URL,
  };
}
