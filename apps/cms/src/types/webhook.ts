export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  format: string;
  createdAt: Date;
  updatedAt: Date;
}
