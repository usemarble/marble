import { openrouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { system } from "./system";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openrouter.chat("google/gemini-2.5-flash"),
    system,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
