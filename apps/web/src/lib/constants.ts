import Bounty from "@/components/icons/brand/Bounty.astro";
import Databuddy from "@/components/icons/brand/Databuddy.astro";
import Helix from "@/components/icons/brand/Helix.astro";
import Ia from "@/components/icons/brand/Ia.astro";
import Mantlz from "@/components/icons/brand/Mantlz.astro";
import Opencut from "@/components/icons/brand/Opencut.astro";

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
  EMAIL: "support@marblecms.com",
  URL: "https://marblecms.com",
};

export const SOCIAL_LINKS: Link[] = [
  { href: "https://github.com/usemarble", label: "GitHub" },
  { href: "https://x.com/usemarblecms", label: "Twitter" },
  { href: "support@marblecms.com", label: "Email" },
  { href: "/rss.xml", label: "RSS" },
];

export const APP: Site = {
  TITLE: "Marble",
  DESCRIPTION: "The smarter way to manage your blog.",
  URL: "https://app.marblecms.com",
  EMAIL: "support@marblecms.com",
};

export const FAQs: {
  question: string;
  answer: string;
}[] = [
  {
    question: "Is marblecms free?",
    answer:
      "Yes, marblecms is free to use with generous limits on all core features. We also offer paid plans for teams needing higher limits and advanced features.",
  },
  {
    question: "How does marblecms work?",
    answer:
      "Marblecms is a headless CMS that provides content management through a simple API. You can create, edit and manage content through our dashboard, then fetch it via our API to display on your website or app.",
  },
  {
    question: "Do I need technical knowledge to use marblecms?",
    answer:
      "No technical knowledge is required to use our content management dashboard. However, to integrate the API with your website or app, basic development experience is helpful. We provide detailed <a href='https://docs.marblecms.com'>documentation</a> and templates to make integration easy.",
  },
  {
    question: "What kind of content can I manage?",
    answer:
      "Marblecms is primarily focused on managing blog posts, articles, and static pages. We support rich text, images, and videos to help you create engaging content for your blog or documentation site.",
  },
  {
    question: "Is there a limit on API requests?",
    answer:
      "Free accounts include unlimited API requests. We implement fair usage policies to prevent abuse but typical usage patterns are well within our limits.",
  },
  {
    question: "Can I export my content?",
    answer:
      "Yes, you can export all your content at any time in common formats like JSON. Your content always belongs to you and you're never locked in.",
  },
];

export type Pricing = {
  title: string;
  description: string;
  price: {
    monthly: string;
    yearly: string;
  };
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
      "500 MB media storage",
      "Single member",
      "10k API requests per month",
      "Webhooks",
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
      monthly: "$10",
      yearly: "$100",
    },
    features: [
      "Unlimited posts",
      "2 GB media storage",
      "Up to 10 team members",
      "Unlimited API requests per month",
      "Readability insights",
      "Keyword optimization suggestions",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Get Started",
    },
  },
  // {
  //   title: "Team",
  //   description: "For Growing Teams",
  //   price: {
  //     monthly: "$15",
  //     yearly: "$150",
  //   },
  //   features: [
  //     "Unlimited posts",
  //     "5 GB media storage",
  //     "Up to 10 team members",
  //     "Unlimited API requests per month",
  //     "Advanced readability insights",
  //     "Keyword optimization suggestions",
  //   ],
  //   button: {
  //     href: "https://app.marblecms.com",
  //     label: "Get Started",
  //   },
  // },
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
    question: "How do I get a refund?",
    answer:
      "To request a refund, please contact us at <a href='mailto:hello@marblecms.com'>hello@marblecms.com</a> within 7 days of your purchase. We're also available on X at <a href='https://x.com/usemarblecms'>usemarblecms</a> and on our <a href='https://discord.gg/gU44Pmwqkx'>Discord</a> channel.",
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
