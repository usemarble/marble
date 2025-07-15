export type PricingPlan = {
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

export const PRICING_PLANS: PricingPlan[] = [
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
      "50 Webhook events per month",
      "Advanced readability insights",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Get Started",
    },
  },
  {
    title: "Team",
    description: "For Growing Startups",
    price: {
      monthly: "$15",
      yearly: "$150",
    },
    features: [
      "Unlimited posts",
      "5 GB media storage",
      "Up to 10 team members",
      "Unlimited API requests per month",
      "100 Webhook events per month",
      "Advanced readability insights",
      "Keyword optimization suggestions",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Get Started",
    },
  },
];

export const timezones = Intl.supportedValuesOf("timeZone");
