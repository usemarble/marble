import { getSecret } from "astro:env/server";
import { Marble } from "@usemarble/sdk";

const key = getSecret("MARBLE_API_KEY");

if (!key) {
  throw new Error("Missing MARBLE_API_KEY in environment variables");
}

export const marble = new Marble({
  apiKey: key,
});
