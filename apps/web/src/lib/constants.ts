export type Site = {
  TITLE: string;
  DESCRIPTION: string;
  EMAIL: string;
  URL: string;
};

export type Link = {
  href: string;
  label: string;
};

export const SITE: Site = {
  TITLE: "Marble",
  DESCRIPTION: "A smarter way to manage your blog.",
  EMAIL: "hello@taqib.dev",
  URL: "https://marblecms-web.vercel.app",
};

export const SOCIAL_LINKS: Link[] = [
  { href: "https://github.com/taqh", label: "GitHub" },
  { href: "https://twitter.com/rahimtkb", label: "Twitter" },
  { href: "hello@taqib.dev", label: "Email" },
  { href: "/rss.xml", label: "RSS" },
];
