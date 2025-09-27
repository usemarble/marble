import {
  FacebookLogoIcon,
  GithubLogoIcon,
  GlobeHemisphereEastIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";
import { PLATFORM_DOMAINS, type SocialPlatform } from "@/lib/constants";

/**
 * Detects the social platform from a URL
 */
export function detectPlatform(url: string): SocialPlatform {
  try {
    const normalized = /^(https?:)?\/\//i.test(url) ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    const host = hostname.toLowerCase().replace(/^www\./, "");

    for (const [platform, domains] of Object.entries(PLATFORM_DOMAINS)) {
      if (
        domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
      ) {
        return platform as SocialPlatform;
      }
    }

    return "website";
  } catch {
    return "website";
  }
}

/**
 * Gets the display name for a social platform
 */
export function getPlatformDisplayName(platform: SocialPlatform): string {
  const displayNames: Record<SocialPlatform, string> = {
    x: "X (Twitter)",
    github: "GitHub",
    facebook: "Facebook",
    instagram: "Instagram",
    youtube: "YouTube",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    website: "Website",
  };

  return displayNames[platform] || platform;
}

export const getPlatformIcon = (platform: SocialPlatform) => {
  const iconProps = { className: "size-6 text-muted-foreground" };

  switch (platform) {
    case "x":
      return <XLogoIcon {...iconProps} />;
    case "github":
      return <GithubLogoIcon {...iconProps} />;
    case "linkedin":
      return <LinkedinLogoIcon {...iconProps} />;
    case "facebook":
      return <FacebookLogoIcon {...iconProps} />;
    case "instagram":
      return <InstagramLogoIcon {...iconProps} />;
    case "youtube":
      return <YoutubeLogoIcon {...iconProps} />;
    case "tiktok":
      return <GlobeHemisphereEastIcon {...iconProps} />;
    case "website":
      return <GlobeHemisphereEastIcon {...iconProps} />;
    default:
      return <GlobeHemisphereEastIcon {...iconProps} />;
  }
};
