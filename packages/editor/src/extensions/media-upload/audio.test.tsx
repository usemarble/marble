// @vitest-environment happy-dom
import { sanitizeHtml } from "@marble/utils/sanitize";
import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExtensionKit } from "../extension-kit";
import { defaultSlashSuggestions } from "../slash-command/groups";
import { AudioUpload, VideoUpload } from "./index";

const src = "https://cdn.example.com/song.mp3";
let editor: Editor;
let root: Root;
let container: HTMLDivElement;

async function mount(mediaUpload: typeof AudioUpload) {
  editor = new Editor({
    extensions: [
      ...ExtensionKit().filter(
        (extension) => extension.name !== mediaUpload.name
      ),
      mediaUpload,
    ],
    content: "<p>Before</p><p>After</p>",
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(<EditorContent editor={editor} />));
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  editor?.destroy();
  container?.remove();
  vi.unstubAllGlobals();
});

describe("audio authoring", () => {
  it("edits an attached caption and preserves it in saved HTML and JSON", async () => {
    await mount(AudioUpload);
    await act(async () => {
      editor.commands.setAudio({ src });
    });
    const input = container.querySelector<HTMLInputElement>(
      'input[aria-label="Audio caption"]'
    );
    expect(input).not.toBeNull();
    const caption = "Live <recording> & credits";
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;
    await act(async () => {
      setValue?.call(input, caption);
      input?.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(
      editor.getJSON().content?.find((node) => node.type === "audio")?.attrs
        ?.caption
    ).toBe(caption);
    const saved = sanitizeHtml(editor.getHTML());
    const document = new DOMParser().parseFromString(saved, "text/html");
    expect(
      document.querySelector('figure[data-type="audio"] > figcaption')
        ?.textContent
    ).toBe(caption);
    await act(async () => {
      editor.commands.setContent(saved);
    });
    expect(
      container.querySelector<HTMLInputElement>(
        'input[aria-label="Audio caption"]'
      )?.value
    ).toBe(caption);
    expect(
      editor.getJSON().content?.find((node) => node.type === "audio")?.attrs
        ?.caption
    ).toBe(caption);
  });

  it("opens existing bare audio HTML and JSON with an empty caption", async () => {
    await mount(AudioUpload);
    for (const content of [
      `<audio src="${src}" controls preload="metadata"></audio>`,
      { type: "doc", content: [{ type: "audio", attrs: { src } }] },
    ]) {
      await act(async () => {
        editor.commands.setContent(content);
      });
      expect(container.querySelector("figure audio")?.getAttribute("src")).toBe(
        src
      );
      expect(
        container.querySelector<HTMLInputElement>(
          'input[aria-label="Audio caption"]'
        )?.value
      ).toBe("");
      expect(editor.getHTML()).toContain('<figure data-type="audio">');
    }
  });
  it("keeps video uploads working through the shared media picker", async () => {
    const videoSrc = "https://cdn.example.com/clip.mp4";
    const upload = vi.fn(async () => videoSrc);
    await mount(VideoUpload.configure({ upload }));
    const file = new File(["video"], "clip.mp4", { type: "video/mp4" });
    await act(async () => {
      editor.commands.setVideoUpload({ file });
    });
    expect(upload).toHaveBeenCalledExactlyOnceWith(file);
    const video = editor.view.dom.querySelector("video");
    expect(video?.src).toBe(videoSrc);
    expect(video?.controls).toBe(true);
    expect(editor.getHTML()).toContain('data-type="video"');
  });
  it("inserts through /audio, uploads in place, and reopens playable saved HTML", async () => {
    let finishUpload: ((url: string) => void) | undefined;
    const upload = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          finishUpload = resolve;
        })
    );
    await mount(
      AudioUpload.configure({ upload, accept: "audio/mpeg", maxSize: 1024 })
    );
    const suggestions = await defaultSlashSuggestions?.({
      query: "audio",
      editor,
      signal: new AbortController().signal,
    });
    const command = suggestions?.find((item) => item.title === "Audio");
    expect(command).toBeDefined();
    await act(async () => {
      editor.commands.setContent("<p>Before</p><p>/audio</p><p>After</p>");
      editor.commands.setTextSelection(15);
      command?.command({ editor, range: { from: 9, to: 15 } });
    });
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input?.accept).toBe("audio/mpeg");
    const file = new File(["audio"], "song.mp3", { type: "audio/mpeg" });
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    await act(async () =>
      input?.dispatchEvent(new Event("change", { bubbles: true }))
    );
    expect(upload).toHaveBeenCalledExactlyOnceWith(file);
    await act(async () => {
      editor.commands.setTextSelection(1);
      finishUpload?.(src);
    });
    expect(editor.getJSON().content?.map((node) => node.type)).toEqual([
      "paragraph",
      "audio",
      "paragraph",
    ]);
    const saved = sanitizeHtml(editor.getHTML());
    const reopened = new Editor({ extensions: ExtensionKit(), content: saved });
    const audio = new DOMParser()
      .parseFromString(reopened.getHTML(), "text/html")
      .querySelector<HTMLAudioElement>("figure[data-type=audio] > audio");
    expect(audio?.src).toBe(src);
    expect(audio?.controls).toBe(true);
    expect(audio?.preload).toBe("metadata");
    expect(reopened.getJSON().content?.map((node) => node.type)).toEqual([
      "paragraph",
      "audio",
      "paragraph",
    ]);
    reopened.destroy();
  });

  it("loads audio from the media library and inserts the selected file", async () => {
    const fetchMediaPage = vi.fn(async () => ({
      media: [
        { id: "song", name: "song.mp3", url: src, type: "audio" as const },
      ],
    }));
    await mount(
      AudioUpload.configure({ upload: async () => src, fetchMediaPage })
    );
    await act(async () => {
      editor.commands.setAudioUpload();
    });
    expect(fetchMediaPage).not.toHaveBeenCalled();
    const libraryButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Media library")
    );
    await act(async () => libraryButton?.click());
    expect(fetchMediaPage).toHaveBeenCalledWith(undefined, "audio");
    const fileButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("song.mp3")
    );
    expect(fileButton).toBeDefined();
    await act(async () => fileButton?.click());
    expect(editor.getHTML()).toContain("<audio");
    expect(editor.getHTML()).toContain(src);
    expect(
      editor.getJSON().content?.some((node) => node.type === "audioUpload")
    ).toBe(false);
  });

  it("rejects unsupported or oversized files before uploading", async () => {
    const upload = vi.fn(async () => src);
    const onError = vi.fn();
    await mount(
      AudioUpload.configure({
        upload,
        onError,
        accept: "audio/mpeg",
        maxSize: 3,
      })
    );
    await act(async () => {
      editor.commands.setAudioUpload();
    });
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    for (const file of [
      new File(["x"], "video.mp4", { type: "video/mp4" }),
      new File(["large"], "song.mp3", { type: "audio/mpeg" }),
    ]) {
      Object.defineProperty(input, "files", {
        value: [file],
        configurable: true,
      });
      await act(async () =>
        input?.dispatchEvent(new Event("change", { bubbles: true }))
      );
    }
    expect(upload).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
