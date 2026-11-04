import { Input } from "@marble/ui/components/input";
import { cn } from "@marble/ui/lib/utils";
import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";

export function AudioView({ node, updateAttributes, selected }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
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
        controls
        loop={node.attrs.loop === true}
        muted={node.attrs.muted === true}
        preload="metadata"
        src={src}
      />
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
