export interface WebhookListItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  format: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Webhook extends WebhookListItem {
  secret: string;
}

export interface WebhookDeliveryAttempt {
  id: string;
  attemptNumber: number;
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  eventId: string;
  eventType: string;
  eventCreatedAt: string;
  status: string;
  url: string;
  isTest: boolean;
  attemptCount: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  payload: unknown;
  latestAttempt: WebhookDeliveryAttempt | null;
  attempts: WebhookDeliveryAttempt[];
}

export interface WebhookDetailResponse {
  webhook: Webhook;
  deliveries: WebhookDelivery[];
  pageCount: number;
  totalCount: number;
}
