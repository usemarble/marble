export const EMAIL_CONFIG = {
  /**
   * Site URL for marketing site (logo, assets, etc.)
   * Falls back to production URL if not set
   */
  getSiteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL || "https://marblecms.com";
  },

  /**
   * App/Dashboard URL for the CMS application
   * Falls back to production URL if not set
   */
  getAppUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "https://app.marblecms.com";
  },

  /**
   * Get logo URL with fallback (uses site URL)
   */
  getLogoUrl(): string {
    const siteUrl = this.getSiteUrl();
    return `${siteUrl}/logo.svg`;
  },

  /**
   * Reply-to email address
   */
  replyTo: "support@marblecms.com",

  /**
   * From email address
   */
  from: "Marble <notifications@marblecms.com>",

  /**
   * Founder email configuration
   */
  founderFrom: "Taqib <taqib@marblecms.com>",
  founderReplyTo: "taqib@marblecms.com",
  calLink: "https://cal.com/taqib",
  twitterLink: "https://x.com/retaqib",

  /**
   * Physical mailing address for CAN-SPAM compliance
   */
  physicalAddress: {
    name: "Marble",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "Federal Republic of Nigeria",
  },
} as const;
