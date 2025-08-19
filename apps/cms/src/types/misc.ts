import type { MediaType } from "./media";

export type AuthMethod = "google" | "github" | "email";

export type Media = {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  createdAt: string;
};
