import { Input } from "@marble/ui/components/input";
import { cn } from "@marble/ui/lib/utils";
import { parseAudioSources } from "@marble/utils/media";
import type { NodeViewProps } from "@tiptap/core";
import { sanitizeAudioSrc } from "@tiptap/extension-audio";
import { NodeViewWrapper } from "@tiptap/react";
import { useEffect, useMemo, useRef } from "react";

export function AudioView({ node, updateAttributes, selected }: NodeViewProps) {
  const src =
    sanitizeAudioSrc(
      typeof node.attrs.src === "string" ? node.attrs.src : ""
    ) ?? undefined;
  const sources = useMemo(
    () => parseAudioSources(node.attrs.sources),
    [node.attrs.sources]
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!src && sources.length > 0) {
      audioRef.current?.load();
    }
  }, [src, sources]);
  const caption =
    typeof node.attrs.caption === "string" ? node.attrs.caption : "";

  return (
    <NodeViewWrapper
      aria-label="Audio figure"
      as="figure"
      className={cn(
        "my-5 w-full",
        selected && "outline-2 outline-primary outline-offset-2"
      )}
    >
      <audio
        aria-label="Audio player"
        className="w-full"
        contentEditable={false}
        controls={node.attrs.controls !== false}
        loop={node.attrs.loop === true}
        muted={node.attrs.muted === true}
        preload="metadata"
        ref={audioRef}
        src={src}
      >
        {sources.map((source) => (
          <source
            key={`${source.src}-${source.type ?? ""}`}
            src={sanitizeAudioSrc(source.src) ?? undefined}
            type={source.type}
          />
        ))}
      </audio>
      <figcaption contentEditable={false}>
        <Input
          aria-label="Audio caption"
          className="mt-2 h-auto rounded-none border-0 bg-transparent p-0 text-center text-muted-foreground text-sm shadow-none focus-visible:ring-0"
          onChange={(event) =>
            updateAttributes({ caption: event.target.value })
          }
          placeholder="Describe this audio..."
          value={caption}
        />
      </figcaption>
    </NodeViewWrapper>
  );
}
