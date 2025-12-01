import { createHash } from "node:crypto";
import { customAlphabet } from "nanoid";
import { API_KEY_PREFIXES } from "../constants/api-key";
import type { ApiKeyType } from "../types/api-key";

/**
 * Hash an API key using SHA-256
 * @param key - The plaintext API key to hash
 * @returns The SHA-256 hash of the key as a hex string (64 characters)
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Verify a plaintext API key against its hash
 * @param plainKey - The plaintext API key to verify
 * @param hashedKey - The hashed API key to compare against
 * @returns True if the plaintext key matches the hash
 */
export function verifyApiKey(plainKey: string, hashedKey: string): boolean {
  return hashApiKey(plainKey) === hashedKey;
}

/**
 * Generates an API key with prefix, hash, and preview
 * @param type - The type of API key (public or private)
 * @returns Object containing the full plaintext key, its hash, prefix, and preview
 */
export function generateApiKey(type: ApiKeyType) {
  const prefix =
    type === "public" ? API_KEY_PREFIXES.public : API_KEY_PREFIXES.private;
  const nanoid = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    24
  );
  const randomSuffix = nanoid();
  const fullKey = `${prefix}_${randomSuffix}`;
  const hash = hashApiKey(fullKey);
  const preview = `${prefix}...${randomSuffix.slice(-4)}`;

  return {
    key: fullKey,
    hash,
    prefix,
    preview,
  };
}
