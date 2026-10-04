import { generateText } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { createRequestLogger } from "evlog";
import { describe, expect, it } from "vitest";
import { wrapModel } from "./model";

const usage = {
  inputTokens: {
    total: 12,
    noCache: 12,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

describe("wrapModel", () => {
  it("records the call on the request's wide event", async () => {
    const log = createRequestLogger({});
    const { model, telemetry } = wrapModel(
      log,
      new MockLanguageModelV4({
        doGenerate: {
          content: [{ type: "text", text: "hello" }],
          finishReason: { unified: "stop", raw: undefined },
          usage,
          warnings: [],
        },
      })
    );

    const result = await generateText({ model, prompt: "hi", telemetry });

    expect(result.text).toBe("hello");
    expect(log.getContext().ai).toMatchObject({
      calls: 1,
      inputTokens: 12,
      outputTokens: 5,
      finishReason: "stop",
    });
  });
});
