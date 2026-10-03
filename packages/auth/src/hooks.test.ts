import type { User } from "better-auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storeUserImage } from "./hooks";
import { testEnv } from "./test-env";

function user(image: string | null): User {
  return {
    id: "avatar-user",
    name: "Avatar User",
    email: "avatar@staging.invalid",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("provider avatar copies", () => {
  it("copies the avatar bytes and content type through the R2 binding", async () => {
    const env = testEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "image/png" },
        })
      )
    );
    const result = await storeUserImage(
      env,
      user("https://avatars.githubusercontent.com/u/123")
    );
    expect(env.STORAGE.put).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/avatar-user\/.+\.png$/),
      new Uint8Array([1, 2, 3]).buffer,
      { httpMetadata: { contentType: "image/png" } }
    );
    expect(result?.avatarUrl).toMatch(
      /^https:\/\/cdn-test.marblecms.com\/avatars\/avatar-user\//
    );
  });

  it.each([
    null,
    "http://avatars.githubusercontent.com/u/123",
    "https://avatars.githubusercontent.com.attacker.invalid/image.png",
    "https://internal.invalid/image.png",
  ])("does not fetch or store an untrusted avatar: %s", async (image) => {
    const env = testEnv();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await storeUserImage(env, user(image));
    expect(fetch).not.toHaveBeenCalled();
    expect(env.STORAGE.put).not.toHaveBeenCalled();
  });

  it("preserves the provider avatar if R2 fails", async () => {
    const env = testEnv();
    vi.mocked(env.STORAGE.put).mockRejectedValue(new Error("R2 unavailable"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("avatar")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(
      await storeUserImage(
        env,
        user("https://lh3.googleusercontent.com/avatar")
      )
    ).toBeUndefined();
  });
});
