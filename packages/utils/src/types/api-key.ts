import type { API_KEY_PREFIXES } from "../constants/api-key";

export type ApiKeyPrefix =
  (typeof API_KEY_PREFIXES)[keyof typeof API_KEY_PREFIXES];

export type ApiKeyType = "public" | "private";
