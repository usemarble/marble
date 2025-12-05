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
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const figureRef = useRef<HTMLElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Sync local state with node attributes when they change externally
  useEffect(() => {
    setAltValue(alt || "");
    setCaptionValue(caption || "");
    setWidthValue(width || "100");
    setAlignValue(align || "center");
  }, [alt, caption, width, align]);

  // Close popover when node is deselected
  useEffect(() => {
    if (!selected) {
      setIsPopoverOpen(false);
    }
  }, [selected]);

  // Handle image click to toggle popover
  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (selected) {
        e.preventDefault();
        e.stopPropagation();
        setIsPopoverOpen((prev) => !prev);
      }
    },
    [selected]
  );

  // Handle keyboard events for accessibility
  const handleImageKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (selected && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        e.stopPropagation();
        setIsPopoverOpen((prev) => !prev);
      }
    },
    [selected]
  );

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

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newWidth = e.target.value;
      // Only allow numbers and empty string
      if (!/^\d*$/.test(newWidth)) {
        return;
      }

      // Allow any valid number input during typing
      setWidthValue(newWidth);

      // Only update attributes if we have a valid number
      if (newWidth && Number.parseInt(newWidth, 10) > 0) {
        updateAttributes({ width: newWidth });
      }
    },
    [updateAttributes]
  );

  const handleWidthBlur = useCallback(() => {
    // Validate and clamp on blur - only percent for now
    const numValue = Number.parseInt(widthValue, 10) || 100;
    const minValue = 10;
    const maxValue = 100;

    const clampedValue = Math.max(minValue, Math.min(maxValue, numValue));
    const finalWidth = String(clampedValue);

    setWidthValue(finalWidth);
    updateAttributes({ width: finalWidth, widthUnit: "percent" });
  }, [widthValue, updateAttributes]);

  // Width unit change disabled - only percent for now
  // const handleWidthUnitChange = useCallback(
  //   (newUnit: "percent" | "pixel") => {
  //     setWidthUnitValue(newUnit);
  //     // Convert width value when switching units
  //     const currentNum = Number.parseInt(widthValue, 10) || 100;
  //     const containerWidth =
  //       figureRef.current?.parentElement?.clientWidth || 800;
  //     let newWidth = widthValue;

  //     if (newUnit === "pixel" && widthUnitValue === "percent") {
  //       // Converting from % to px - use actual container width
  //       newWidth = String(Math.round((currentNum / 100) * containerWidth));
  //     } else if (newUnit === "percent" && widthUnitValue === "pixel") {
  //       // Converting from px to %
  //       newWidth = String(Math.round((currentNum / containerWidth) * 100));
  //     }

  //     setWidthValue(newWidth);
  //     updateAttributes({ width: newWidth, widthUnit: newUnit });
  //   },
  //   [updateAttributes, widthValue, widthUnitValue]
  // );

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

  // Resize handle drag handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startXRef.current = e.clientX;
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

      // Only percent for now
      const deltaPercent = (deltaX / containerWidth) * 100;
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

  // Calculate alignment styles - only percent for now
  const alignmentStyles: React.CSSProperties = {
    width: `${widthValue}%`,
    marginLeft: alignValue === "left" ? 0 : "auto",
    marginRight: alignValue === "right" ? 0 : "auto",
  };

  return (
    <NodeViewWrapper className="my-5" data-drag-handle>
      <Popover modal onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
        <PopoverTrigger asChild>
          {/* biome-ignore lint: PopoverTrigger with asChild handles interactivity, figure is semantically correct for image with caption */}
          <figure
            aria-label="Image settings"
            className={cn(
              "relative cursor-pointer",
              selected && "outline-2 outline-primary outline-offset-2"
            )}
            onClick={handleImageClick}
            onKeyDown={handleImageKeyDown}
            ref={figureRef}
            style={alignmentStyles}
            tabIndex={selected ? 0 : -1}
          >
            {/* biome-ignore lint: Tiptap NodeView requires standard img element */}
            <img
              alt={altValue}
              className="h-auto w-full rounded-md border border-muted"
              src={src}
            />

            {/* Resize handles - only shown when selected */}
            {selected && (
              <>
                {/* Left handle */}
                <button
                  className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-0 z-20 h-16 w-2 cursor-ew-resize rounded-sm bg-primary opacity-0 transition-opacity hover:opacity-100"
                  onMouseDown={handleResizeStart}
                  title="Drag to resize"
                  type="button"
                />
                {/* Right handle */}
                <button
                  className="-translate-y-1/2 absolute top-1/2 right-0 z-20 h-16 w-2 translate-x-1/2 cursor-ew-resize rounded-sm bg-primary opacity-0 transition-opacity hover:opacity-100"
                  onMouseDown={handleResizeStart}
                  title="Drag to resize"
                  type="button"
                />
              </>
            )}

            {/* Caption - only shown when it has content */}
            {caption && (
              <figcaption className="mt-2 text-center text-muted-foreground text-sm italic">
                <p>{caption}</p>
              </figcaption>
            )}
          </figure>
        </PopoverTrigger>

        {/* Toolbar in Popover - only shown when selected */}
        <PopoverContent
          align="start"
          className="flex w-80 flex-col gap-3 p-3"
          onOpenAutoFocus={(event) => event.preventDefault()}
          side="right"
          sideOffset={18}
        >
          {/* Width Controls - Only percent for now */}
          <div className="space-y-2">
            <Label className="font-medium text-xs" htmlFor="image-width">
              Width (%)
            </Label>
            <Input
              className="h-8 text-sm"
              id="image-width"
              onBlur={handleWidthBlur}
              onChange={handleWidthChange}
              placeholder="100"
              type="text"
              value={widthValue}
            />
          </div>

          {/* Alignment Controls */}
          <div className="space-y-2">
            <Label className="font-medium text-xs">Alignment</Label>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                className="!rounded-sm w-full shadow-none data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                data-active={alignValue === "left"}
                onClick={() => handleAlignChange("left")}
                type="button"
                variant="outline"
              >
                {/* <AlignLeft className="size-4" /> */}
                Left
              </Button>
              <Button
                className="!rounded-sm w-full shadow-none data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                data-active={alignValue === "center"}
                onClick={() => handleAlignChange("center")}
                type="button"
                variant="outline"
              >
                {/* <AlignCenter className="size-4" /> */}
                Center
              </Button>
              <Button
                className="!rounded-sm w-full shadow-none data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                data-active={alignValue === "right"}
                onClick={() => handleAlignChange("right")}
                type="button"
                variant="outline"
              >
                {/* <AlignRight className="size-4" /> */}
                Right
              </Button>
            </div>
          </div>

          <div className="space-y-2">
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
          <div className="space-y-2">
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
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
};
