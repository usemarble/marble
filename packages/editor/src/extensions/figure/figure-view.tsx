/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: <> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <> */
import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, Settings2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export const FigureView = ({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) => {
  const { src, alt, caption, width, align } = node.attrs as {
    src: string;
    alt: string;
    caption: string;
    width: string;
    align: "left" | "center" | "right";
  };

  const [altValue, setAltValue] = useState(alt || "");
  const [captionValue, setCaptionValue] = useState(caption || "");
  const [widthValue, setWidthValue] = useState(width || "100");
  const [alignValue, setAlignValue] = useState<"left" | "center" | "right">(
    align || "center"
  );
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const figureRef = useRef<HTMLElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const resizeSideRef = useRef<"left" | "right">("right");

  const altId = useId();
  const captionId = useId();

  // Sync local state with node attributes when they change externally
  useEffect(() => {
    setAltValue(alt || "");
    setCaptionValue(caption || "");
    setWidthValue(width || "100");
    setAlignValue(align || "center");
  }, [alt, caption, width, align]);

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

  const handleAlignChange = useCallback(
    (newAlign: "left" | "center" | "right") => {
      setAlignValue(newAlign);
      // Use setTimeout to avoid Tiptap position conflicts
      setTimeout(() => {
        updateAttributes({ align: newAlign });
      }, 0);
    },
    [updateAttributes]
  );

  const handleResizeStart = useCallback(
    (side: "left" | "right") => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startXRef.current = e.clientX;
      resizeSideRef.current = side;
      const currentWidth = Number.parseInt(widthValue, 10) || 100;
      startWidthRef.current = currentWidth;
    },
    [widthValue]
  );

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const containerWidth =
        figureRef.current?.parentElement?.clientWidth || 800;

      const effectiveDelta =
        resizeSideRef.current === "left" ? -deltaX : deltaX;
      const deltaPercent = (effectiveDelta / containerWidth) * 100;
      const newWidth = Math.max(
        10,
        Math.min(100, startWidthRef.current + deltaPercent)
      );

      const roundedWidth = Math.round(newWidth);
      setWidthValue(String(roundedWidth));
      updateAttributes({ width: String(roundedWidth), widthUnit: "percent" });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, updateAttributes]);

  // Calculate alignment styles
  const alignmentStyles: React.CSSProperties = {
    width: `${widthValue}%`,
    marginLeft: alignValue === "left" ? 0 : "auto",
    marginRight: alignValue === "right" ? 0 : "auto",
  };

  const showToolbar = selected || isHovered;

  return (
    <NodeViewWrapper className="my-5" data-drag-handle>
      <figure
        aria-label="Image figure"
        className={cn(
          "relative",
          selected && "outline-2 outline-primary outline-offset-2"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={figureRef}
        style={alignmentStyles}
      >
        {/* biome-ignore lint: Tiptap NodeView requires standard img element */}
        <img
          alt={altValue}
          className="h-auto w-full rounded-md border border-muted"
          src={src}
        />

        {showToolbar && (
          // biome-ignore lint/a11y/noStaticElementInteractions: <>
          <div
            className="absolute top-2 right-2 z-30 flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Alignment buttons */}
            <Button
              className={cn(
                "size-7 p-0",
                alignValue === "left" && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleAlignChange("left")}
              size="icon"
              title="Align left"
              type="button"
              variant="ghost"
            >
              <AlignLeft className="size-3.5" />
            </Button>
            <Button
              className={cn(
                "size-7 p-0",
                alignValue === "center" && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleAlignChange("center")}
              size="icon"
              title="Align center"
              type="button"
              variant="ghost"
            >
              <AlignCenter className="size-3.5" />
            </Button>
            <Button
              className={cn(
                "size-7 p-0",
                alignValue === "right" && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleAlignChange("right")}
              size="icon"
              title="Align right"
              type="button"
              variant="ghost"
            >
              <AlignRight className="size-3.5" />
            </Button>

            {/* Divider */}
            <div className="mx-0.5 h-5 w-px bg-border" />

            {/* Settings button with popover */}
            <Popover modal="trap-focus">
              <PopoverTrigger
                render={(props) => (
                  <Button
                    {...props}
                    className="size-7 p-0"
                    size="icon"
                    title="Image settings"
                    type="button"
                    variant="ghost"
                  >
                    <Settings2 className="size-3.5" />
                  </Button>
                )}
              />
              <PopoverContent
                align="end"
                className="flex w-72 flex-col gap-3 p-3"
                side="bottom"
                sideOffset={8}
              >
                {/* Alt Text */}
                <div className="space-y-1.5">
                  <Label className="font-medium text-xs" htmlFor={altId}>
                    Alt Text
                  </Label>
                  <Input
                    className="h-8 text-sm"
                    id={altId}
                    onChange={handleAltChange}
                    placeholder="Describe the image..."
                    type="text"
                    value={altValue}
                  />
                </div>

                {/* Caption */}
                <div className="space-y-1.5">
                  <Label className="font-medium text-xs" htmlFor={captionId}>
                    Caption
                  </Label>
                  <Input
                    className="h-8 text-sm"
                    id={captionId}
                    onChange={handleCaptionChange}
                    placeholder="Add a caption..."
                    type="text"
                    value={captionValue}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {showToolbar && (
          <>
            <button
              className="-translate-y-1/2 absolute top-1/2 left-2 z-20 h-8 w-1 cursor-ew-resize rounded-full border border-foreground border-white bg-background transition-all"
              onMouseDown={handleResizeStart("left")}
              title="Drag to resize"
              type="button"
            />
            <button
              className="-translate-y-1/2 absolute top-1/2 right-2 z-20 h-8 w-1 cursor-ew-resize rounded-full border border-foreground border-white bg-background transition-all"
              onMouseDown={handleResizeStart("right")}
              title="Drag to resize"
              type="button"
            />
          </>
        )}

        {/* Caption - only shown when it has content */}
        {captionValue && (
          <figcaption className="mt-2 text-center text-muted-foreground text-sm italic">
            <p>{captionValue}</p>
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  );
};
