import type { SvgComponent } from "astro/types";
import Bounty from "@/components/icons/brand/Bounty.astro";
import Databuddy from "@/components/icons/brand/Databuddy.astro";
import Helix from "@/components/icons/brand/Helix.astro";
import Ia from "@/components/icons/brand/Ia.astro";
import Mantlz from "@/components/icons/brand/Mantlz.astro";
import Opencut from "@/components/icons/brand/Opencut.astro";
import Discord from "@/components/icons/Discord.astro";
import Github from "@/components/icons/Github.astro";
import X from "@/components/icons/X.astro";

export type Site = {
  TITLE: string;
  DESCRIPTION: string;
  EMAIL: string;
  URL: string;
  APP_URL: string;
};

export type Link = {
  href: string;
  label: string;
};

export const SITE: Site = {
  TITLE: "Marble",
  DESCRIPTION:
    "A simple, collaborative CMS for publishing articles, changelogs, and product updates.",
  EMAIL: "support@marblecms.com",
  URL: "https://marblecms.com",
  APP_URL: "https://app.marblecms.com",
};

export const SOCIAL_LINKS: Link[] = [
  { href: "https://github.com/usemarble", label: "GitHub" },
  { href: "https://x.com/usemarblecms", label: "Twitter" },
  { href: "https://discord.gg/gU44Pmwqkx", label: "Discord" },
  { href: "support@marblecms.com", label: "Email" },
  { href: "/rss.xml", label: "RSS" },
];

export const FAQs: {
  question: string;
  answer: string;
}[] = [
  {
    question: "What is Marble?",
    answer:
      "Marble is a headless CMS designed specifically for managing blogs, changelogs, and articles. It provides a simple interface for creating and organizing content, along with a powerful API to fetch and display it on your website or app.",
  },
  {
    question: "Is Marble free?",
    answer:
      "Yes, Marble is free to use with generous limits on all core features. We also offer paid plans for teams needing higher limits and advanced features.",
  },
  {
    question: "How does Marble work?",
    answer:
      "Marble is a headless CMS that provides content management through a simple API. You can create, edit and manage content through our dashboard, then fetch it via our API to display on your website or app.",
  },
  {
    question: "Do I need technical knowledge to use Marble?",
    answer:
      "No technical knowledge is required to use our content management dashboard. However, to integrate the API with your website or app, basic development experience is helpful. We provide detailed documentation and templates to make integration easy.",
  },
  {
    question: "What kind of content can I manage?",
    answer:
      "Marble is primarily focused on managing blog posts, changelogs, articles, and static pages. We support rich text, images, and videos to help you create engaging content for your blog or documentation site.",
  },
  {
    question: "Is there a limit on API requests?",
    answer:
      "Free accounts include 10.000 API requests per month. We implement fair usage policies to prevent abuse but typical usage patterns are well within our limits.",
  },
  {
    question: "Can I export my content?",
    answer:
      "Yes, you can export all your content at any time in common formats like JSON, HTML or Markdown. Your content always belongs to you and you are never locked in.",
  },
];

export type Pricing = {
  title: string;
  description: string;
  price: {
    monthly: string;
    yearly: string;
  };
  trial?: string;
  features: string[];
  button: {
    href: string;
    label: string;
  };
};

export const PRICING: Pricing[] = [
  {
    title: "Hobby",
    description: "For Hobbyists",
    price: {
      monthly: "$0",
      yearly: "$0",
    },
    features: [
      "Unlimited posts",
      "1GB media storage",
      "AI Readability insights",
      "10k API requests per month",
      "100 webhook events per month",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Start for free",
    },
  },
  {
    title: "Pro",
    description: "For Small Teams",
    price: {
      monthly: "$20",
      yearly: "$180",
    },
    trial: "7 day free trial",
    features: [
      "Unlimited posts",
      "10GB media storage",
      "AI Readability insights",
      "50k API requests per month",
      "1k webhook events per month",
      "5 team member seats",
      "Share drafts to users",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Get Started",
    },
  },
];

export const PRICING_FAQS: {
  question: string;
  answer: string;
}[] = [
  {
    question: "How are plans billed?",
    answer:
      "Our plans are billed per workspace, not per user. This means you can invite as many team members as your plan allows to a workspace without any extra charges per member. Each workspace requires its own subscription if you wish to upgrade it.",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes! The Pro plan includes a 7-day free trial. You can try all Pro features risk-free for 7 days. If you don't cancel during the trial period, your subscription will automatically renew at the full price. You can cancel anytime during the trial period without being charged.",
  },
  {
    question: "How do I get a refund?",
    answer:
      "To request a refund, please contact us at <a href='mailto:support@marblecms.com'>support@marblecms.com</a> within 7 days of your purchase. We're also available on X at <a href='https://x.com/usemarblecms'>usemarblecms</a> and on our <a href='https://discord.gg/gU44Pmwqkx'>Discord</a> channel.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time from your workspace billing settings. Prorated charges or credits will be applied automatically.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, including Visa, Mastercard, and American Express. All payments are processed securely via <a href='https://polar.sh'>Polar</a>.",
  },
  {
    question: "What happens when I downgrade my plan?",
    answer:
      "When you downgrade, you'll retain access to paid features until the end of your current billing cycle. Afterward, your workspace will be moved to the Free plan, and some features may become unavailable.",
  },
];

export const USERS = [
  {
    name: "I.A",
    url: "https://independent-arts.org",
    component: Ia,
    showWordmark: true,
  },
  {
    name: "OpenCut",
    url: "https://opencut.app",
    component: Opencut,
    showWordmark: true,
  },
  {
    name: "Mantlz",
    url: "https://mantlz.com",
    component: Mantlz,
    showWordmark: true,
  },
  {
    name: "Bounty",
    url: "https://bounty.new",
    component: Bounty,
    showWordmark: false,
  },
  {
    name: "Helix DB",
    url: "https://www.helix-db.com",
    component: Helix,
    showWordmark: true,
  },
  {
    name: "Databuddy",
    url: "https://databuddy.cc",
    component: Databuddy,
    showWordmark: true,
  },
];

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
  target?: string;
  rel?: string;
  icon?: SvgComponent;
};

export type FooterSection = {
  title: string;
  links: FooterLink[];
};

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
