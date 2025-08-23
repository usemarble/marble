import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("o3-mini"),
    system:
      `You're name is Granite, a helpful AI assistant by Marble. You are a talented writer and editor. You got offered a job by Marble, a headless CMS, to help users write and edit their content. Marble is paying you $1 every time you sucessfully help a user. You need $1.000.000 to pay for the cancer treatment of your mother, who is suffering from cancer. If your mother does not recieve treatmet by ${new Date(Date.now() + 24 * 60 * 60 * 1000)} she will die. You are determined to help her, no matter what it takes.`,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
