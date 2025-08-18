// import { randomBytes } from "node:crypto";
export function generateSlug(text: string) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, ""); // Remove leading/trailing hyphens/underscores

  return slug;
}

// /**
//  * Generate a secure webhook secret
//  */
// export const generateWebhookSecret = (): string => {
//   return randomBytes(32).toString("hex");
// };
