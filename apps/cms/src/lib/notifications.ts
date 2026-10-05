export interface NotificationToggleItem {
  key: string;
  scope: "user" | "workspace";
  label: string;
  description: string;
}

export const USER_NOTIFICATION_ITEMS: NotificationToggleItem[] = [
  {
    key: "product",
    scope: "user",
    label: "Product updates",
    description:
      "New features, tips, and changelog digests to help you get the most out of Marble.",
  },
  {
    key: "marketing",
    scope: "user",
    label: "Marketing",
    description:
      "Promotional offers, newsletters, and partner content. You can unsubscribe at any time.",
  },
];

export const WORKSPACE_NOTIFICATION_ITEMS: NotificationToggleItem[] = [
  {
    key: "usageAlerts",
    scope: "workspace",
    label: "Usage alerts",
    description:
      "Warnings when your workspace approaches or exceeds plan limits.",
  },
  {
    key: "subscriptions",
    scope: "workspace",
    label: "Subscriptions",
    description:
      "Trial reminders, renewal confirmations, and plan change summaries.",
  },
];
