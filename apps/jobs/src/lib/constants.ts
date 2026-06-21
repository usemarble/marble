export const LOCAL_APP_URL = "http://localhost:3000";
export const PRODUCTION_APP_URL = "https://app.marblecms.com";
export const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

export const EXPORT_TTL_MS = MILLISECONDS_IN_DAY;

export const WEBHOOK_DELIVERY_RETENTION_DAYS = 30;
export const WEBHOOK_DELIVERY_TIMEOUT_MS = 15_000;

export const USAGE_ALERT_THRESHOLDS = {
  warning: 75,
  critical: 90,
  exhausted: 100,
} as const;

export const MARBLE_COLOR = 5_786_879;
export const MARBLE_AVATAR_URL = "https://marblecms.com/logo.svg";

interface AppUrlEnv {
  APP_URL?: string;
  ENVIRONMENT?: string;
}

export function getAppUrl(env: AppUrlEnv) {
  if (env.ENVIRONMENT === "development") {
    return LOCAL_APP_URL;
  }

  return env.APP_URL || PRODUCTION_APP_URL;
}
