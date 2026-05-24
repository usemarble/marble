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
    id: "free",
    title: "Free",
    description: "For getting started",
    price: {
      monthly: "$0",
      yearly: "$0",
    },
    features: [
      "Unlimited posts",
      "1 Author",
      "1GB media storage",
      "5k API requests per month",
      "100 webhook events per month",
      "1 team member",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Start for free",
    },
  },
  {
    id: "hobby",
    title: "Hobby",
    description: "For hobbyists",
    price: {
      monthly: "$5",
      yearly: "$60",
    },
    features: [
      "Unlimited posts",
      "5 Authors",
      "5GB media storage",
      "AI Readability insights",
      "25k API requests per month",
      "500 webhook events per month",
      "5 team members",
      "Share post drafts",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Upgrade to Hobby",
    },
  },
  {
    id: "pro",
    title: "Pro",
    description: "For growing teams",
    price: {
      monthly: "$20",
      yearly: "$200",
    },
    trial: "3 day free trial",
    features: [
      "Unlimited posts",
      "Unlimited authors",
      "10GB media storage",
      "AI Readability insights",
      "50k API requests per month",
      "1k webhook events per month",
      "10 team members",
      "Share post drafts",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Get Started",
    },
  },
];
