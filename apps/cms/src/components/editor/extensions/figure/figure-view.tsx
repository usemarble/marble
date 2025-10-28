import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { cn } from "@marble/ui/lib/utils";
import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";

export const FigureView = ({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) => {
  const { src, alt, caption, href } = node.attrs as {
    src: string;
    alt: string;
    caption: string;
    href: string | null;
  };

  const [altValue, setAltValue] = useState(alt || "");
  const [captionValue, setCaptionValue] = useState(caption || "");
  const [hrefValue, setHrefValue] = useState(href || "");

  // Sync local state with node attributes when they change externally
  useEffect(() => {
    setAltValue(alt || "");
    setCaptionValue(caption || "");
    setHrefValue(href || "");
  }, [alt, caption, href]);

  const handleAltChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newAlt = e.target.value;
      setAltValue(newAlt);
      updateAttributes({ alt: newAlt });
    },
    [updateAttributes]
  );

  const handleCaptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newCaption = e.target.value;
      setCaptionValue(newCaption);
      updateAttributes({ caption: newCaption });
    },
    [updateAttributes]
  );

  const handleHrefChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHref = e.target.value;
      setHrefValue(newHref);
      updateAttributes({ href: newHref || null });
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper data-drag-handle>
      <figure
        className={cn(
          "relative mx-0 my-4",
          selected && "outline outline-2 outline-primary outline-offset-2"
        )}
      >
        {/* Render image wrapped in anchor if href exists */}
        {href ? (
          <a href={href} rel="noopener noreferrer" target="_blank">
            {/* biome-ignore lint: Tiptap NodeView requires standard img element */}
            <img
              alt={altValue}
              className="w-full rounded-md border border-muted"
              src={src}
            />
          </a>
        ) : (
          /* biome-ignore lint: Tiptap NodeView requires standard img element */
          <img
            alt={altValue}
            className="w-full rounded-md border border-muted"
            src={src}
          />
        )}

        {/* Toolbar overlay - only shown when selected */}
        {selected && (
          <div className="absolute top-2 right-2 z-10 flex w-64 flex-col gap-2 rounded-lg border bg-background p-3 shadow-lg">
            <div className="space-y-1.5">
              <Label className="font-medium text-xs" htmlFor="alt-text">
                Alt Text
              </Label>
              <Input
                className="h-8 text-sm"
                id="alt-text"
                onChange={handleAltChange}
                placeholder="Describe the image..."
                type="text"
                value={altValue}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium text-xs" htmlFor="caption">
                Caption
              </Label>
              <Input
                className="h-8 text-sm"
                id="caption"
                onChange={handleCaptionChange}
                placeholder="Add a caption..."
                type="text"
                value={captionValue}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-medium text-xs" htmlFor="href">
                Link URL (optional)
              </Label>
              <Input
                className="h-8 text-sm"
                id="href"
                onChange={handleHrefChange}
                placeholder="https://example.com"
                type="url"
                value={hrefValue}
              />
            </div>
          </div>
        )}

        {/* Caption - only shown when it has content */}
        {caption && (
          <figcaption className="mt-2 text-center text-muted-foreground text-sm italic">
            {caption}
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  );
};
