import { tool } from "ai";
import { z } from "zod";
import { firecrawl } from "@/lib/firecrawl";

export const scrapeWebsiteTool = tool({
  description: "Scrape a website and return its content",
  inputSchema: z.object({
    url: z
      .string()
      .url({ message: "Please enter a valid URL" })
      .describe("The URL of the website to scrape"),
  }),
  execute: async ({ url }) => {
    const scrape = await firecrawl.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: false,
    });

    return {
      content: scrape.markdown,
    };
  },
});
