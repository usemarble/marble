import type { MediaType } from "@marble/db/client";

export type AuthMethod = "google" | "github" | "email";

export type Media = {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  createdAt: string;
};
