export type Webhook = {
  id: string;
  name: string;
  endpoint: string;
  secret: string;
  events: string[];
  enabled: boolean;
  format: string;
  createdAt: Date;
  updatedAt: Date;
};
