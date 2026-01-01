import type { SvgComponent } from "astro/types";
import Discord from "../../components/icons/Discord.astro";
import Github from "../../components/icons/Github.astro";
import X from "../../components/icons/X.astro";
import { SITE } from "./site";

export interface Link {
  href: string;
  label: string;
}

export const SOCIAL_LINKS: Link[] = [
  { href: "https://github.com/usemarble", label: "GitHub" },
  { href: "https://x.com/usemarblecms", label: "Twitter" },
  { href: "https://discord.gg/gU44Pmwqkx", label: "Discord" },
  { href: "support@marblecms.com", label: "Email" },
  { href: "/rss.xml", label: "RSS" },
];

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  target?: string;
  rel?: string;
  icon?: SvgComponent;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      {
        label: "Get Started",
        href: SITE.APP_URL,
      },
      {
        label: "Pricing",
        href: "/pricing",
      },
      {
        label: "Changelog",
        href: "/changelog",
      },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        label: "Blog",
        href: "/blog",
      },
      {
        label: "Feed",
        href: "/rss.xml",
      },
      {
        label: "Contributors",
        href: "/contributors",
      },
    ],
  },
  {
    title: "Developers",
    links: [
      {
        label: "Documentation",
        href: "https://docs.marblecms.com",
        external: true,
        target: "_blank",
        rel: "noopener",
      },
      {
        label: "Astro Example",
        href: "https://github.com/usemarble/astro-example",
        external: true,
        target: "_blank",
        rel: "noopener",
      },
      {
        label: "Next.js Example",
        href: "https://github.com/usemarble/nextjs-example",
        external: true,
        target: "_blank",
        rel: "noopener",
      },
      {
        label: "TanStack Example",
        href: "https://github.com/usemarble/tanstack-start-example",
        external: true,
        target: "_blank",
        rel: "noopener",
      },
    ],
  },
  {
    title: "Company",
    links: [
      {
        label: "Contact",
        href: "mailto:support@marblecms.com",
      },
      {
        label: "Terms",
        href: "/terms",
      },
      {
        label: "Privacy",
        href: "/privacy",
      },
      {
        label: "Sponsors",
        href: "/sponsors",
      },
    ],
  },
];

export const FOOTER_SOCIAL_LINKS: FooterLink[] = [
  {
    label: "Twitter",
    href: "https://x.com/usemarblecms",
    external: true,
    target: "_blank",
    rel: "noopener",
    icon: X,
  },
  {
    label: "Github",
    href: "https://github.com/usemarble",
    external: true,
    target: "_blank",
    rel: "noopener",
    icon: Github,
  },
  {
    label: "Discord",
    href: "https://discord.marblecms.com",
    external: true,
    target: "_blank",
    rel: "noopener",
    icon: Discord,
  },
];
