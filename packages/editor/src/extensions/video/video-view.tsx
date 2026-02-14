/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: <> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <> */
import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { cn } from "@marble/ui/lib/utils";
import {
  FadersHorizontalIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from "@phosphor-icons/react";
import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export const VideoView = ({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) => {
  const { src, caption, width, align } = node.attrs as {
    src: string;
    caption: string;
    width: string;
    align: "left" | "center" | "right";
  };

  const [captionValue, setCaptionValue] = useState(caption || "");
  const [widthValue, setWidthValue] = useState(width || "100");
  const [alignValue, setAlignValue] = useState<"left" | "center" | "right">(
    align || "center"
  );
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const figureRef = useRef<HTMLElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const resizeSideRef = useRef<"left" | "right">("right");

  const captionId = useId();

  // Sync local state with node attributes when they change externally
  useEffect(() => {
    setCaptionValue(caption || "");
    setWidthValue(width || "100");
    setAlignValue(align || "center");
  }, [caption, width, align]);

  // Handle click outside settings panel
  useEffect(() => {
    if (!showSettings) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(e.target as Node)
      ) {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-settings-trigger]")) {
          setShowSettings(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

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
      updateAttributes({ width: String(roundedWidth) });
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

  const alignmentStyles: React.CSSProperties = {
    width: `${widthValue}%`,
    marginLeft: alignValue === "left" ? 0 : "auto",
    marginRight: alignValue === "right" ? 0 : "auto",
  };

  const showToolbar = selected || isHovered || showSettings;

  return (
    <NodeViewWrapper className="my-5" data-drag-handle>
      <figure
        aria-label="Video figure"
        className={cn(
          "relative",
          selected && "outline-2 outline-primary outline-offset-2"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={figureRef}
        style={alignmentStyles}
      >
        <video
          className="h-auto w-full rounded-md border border-muted"
          controls
          preload="metadata"
          src={src}
        >
          <track kind="captions" />
        </video>

        {showToolbar && (
          <div className="absolute top-2 right-2 z-30 flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow">
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
              <TextAlignLeftIcon className="size-3.5" />
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
              <TextAlignCenterIcon className="size-3.5" />
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
              <TextAlignRightIcon className="size-3.5" />
            </Button>

            {/* Divider */}
            <div className="mx-0.5 h-5 w-px bg-border" />

            <button
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground",
                showSettings && "bg-accent text-accent-foreground"
              )}
              data-settings-trigger
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSettings((prev) => !prev);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              title="Video settings"
              type="button"
            >
              <FadersHorizontalIcon className="size-3.5" />
            </button>
          </div>
        )}

        {showSettings && (
          <div
            className="absolute top-14 right-2 z-40 flex w-72 flex-col gap-3 rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
            ref={settingsPanelRef}
          >
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
          </div>
        )}

        {showToolbar && (
          <>
            <button
              className="-translate-y-1/2 absolute top-1/2 left-2 z-20 h-8 w-1 cursor-ew-resize rounded-full border border-white bg-background transition-all"
              onMouseDown={handleResizeStart("left")}
              title="Drag to resize"
              type="button"
            />
            <button
              className="-translate-y-1/2 absolute top-1/2 right-2 z-20 h-8 w-1 cursor-ew-resize rounded-full border border-white bg-background transition-all"
              onMouseDown={handleResizeStart("right")}
              title="Drag to resize"
              type="button"
            />
          </>
        )}

        {captionValue && (
          <figcaption className="mt-2 text-center text-muted-foreground text-sm italic">
            <p>{captionValue}</p>
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  );
};
