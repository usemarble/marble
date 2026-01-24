/**
 * Centralized email configuration
 */

export const EMAIL_CONFIG = {
  /**
   * Site URL for marketing site (logo, assets, etc.)
   * Falls back to production URL if not set
   */
  getSiteUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "https://marblecms.com";
  },

  /**
   * App/Dashboard URL for the CMS application
   * Falls back to production URL if not set
   */
  getAppUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "https://app.marblecms.com";
  },

  /**
   * @deprecated Use getSiteUrl() or getAppUrl() instead
   * Base URL for backward compatibility
   */
  getBaseUrl(): string {
    return this.getSiteUrl();
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

  /**
   * Get logo URL with fallback (uses site URL)
   */
  getLogoUrl(): string {
    const siteUrl = this.getSiteUrl();
    return `${siteUrl}/logo.svg`;
  },
} as const;
