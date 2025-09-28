import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY must be set for AI suggestions to work.");
}

export const openrouter = createOpenRouter({
  apiKey,
});
