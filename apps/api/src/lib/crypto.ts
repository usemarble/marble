/**
 * Web Crypto API utilities for Cloudflare Workers
 * These functions use the native Web Crypto API instead of Node.js crypto
 * to avoid WASM polyfill issues in the Workers runtime
 */

/**
 * Hash an API key using SHA-256 via Web Crypto API
 * @param key - The plaintext API key to hash
 * @returns The SHA-256 hash of the key as a hex string (64 characters)
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
