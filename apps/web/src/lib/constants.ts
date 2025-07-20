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
  URL: "https://marblecms.com",
};

export const SOCIAL_LINKS: Link[] = [
  { href: "https://github.com/taqh", label: "GitHub" },
  { href: "https://twitter.com/retaqib", label: "Twitter" },
  { href: "hello@taqib.dev", label: "Email" },
  { href: "/rss.xml", label: "RSS" },
];

export const APP: Site = {
  TITLE: "Marble",
  DESCRIPTION: "The smarter way to manage your blog.",
  URL: "https://app.marblecms.com",
  EMAIL: "hello@taqib.dev",
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
      "Up to 2 team members",
      "10k API requests per month",
      "Basic readability insights",
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
      "Up to 5 team members",
      "50k API requests per month",
      "Advanced readability insights",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Get Started",
    },
  },
  {
    title: "Team",
    description: "For Growing Teams",
    price: {
      monthly: "$15",
      yearly: "$150",
    },
    features: [
      "Unlimited posts",
      "5 GB media storage",
      "Up to 10 team members",
      "Unlimited API requests per month",
      "Advanced readability insights",
      "Keyword optimization suggestions",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Get Started",
    },
  },
];
