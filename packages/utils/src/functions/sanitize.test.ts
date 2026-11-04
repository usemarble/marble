import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("audio HTML", () => {
  it("preserves playable audio and safe sources", () => {
    const html =
      '<audio controls preload="metadata" src="https://cdn.example.com/song.mp3"><source src="https://cdn.example.com/song.ogg" type="audio/ogg"></audio>';
    expect(sanitizeHtml(html)).toContain(
      'src="https://cdn.example.com/song.mp3"'
    );
    expect(sanitizeHtml(html)).toContain('controls preload="metadata"');
    expect(sanitizeHtml(html)).toContain(
      '<source src="https://cdn.example.com/song.ogg" type="audio/ogg"'
    );
  });

  it("removes unsafe audio URLs, event handlers, and autoplay", () => {
    const html =
      '<audio controls autoplay onplay="alert(1)" src="javascript:alert(1)"><source src="data:audio/mpeg;base64,AAAA"></audio>';
    const result = sanitizeHtml(html);
    expect(result).toContain("<audio controls");
    expect(result).not.toMatch(/javascript:|data:|onplay|autoplay/);
  });
});
