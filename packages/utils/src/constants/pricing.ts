export interface PricingPlan {
  id: string;
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
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "hobby",
    title: "Hobby",
    description: "For Hobbyists",
    price: {
      monthly: "$0",
      yearly: "$0",
    },
    features: [
      "Unlimited posts",
      "1 author",
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
    id: "pro",
    title: "Pro",
    description: "For Small Teams",
    price: {
      monthly: "$20",
      yearly: "$180",
    },
    trial: "3 day free trial",
    features: [
      "Unlimited posts",
      "Unlimited authors",
      "10GB media storage",
      "AI Readability insights",
      "50k API requests per month",
      "1k webhook events per month",
      "5 team members",
      "Share post drafts",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Get Started",
    },
  },
];
