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
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFloatingPortalContainer } from "@/components/editor/floating-portal-context";

export const FigureView = ({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) => {
  const { src, alt, caption, href, width, height, widthUnit, align } =
    node.attrs as {
      src: string;
      alt: string;
      caption: string;
      href: string | null;
      width: string;
      height: string | null;
      widthUnit: "percent" | "pixel";
      align: "left" | "center" | "right";
    };

  const [altValue, setAltValue] = useState(alt || "");
  const [captionValue, setCaptionValue] = useState(caption || "");
  const [hrefValue, setHrefValue] = useState(href || "");
  const [widthValue, setWidthValue] = useState(width || "100");
  const [heightValue, setHeightValue] = useState(height || null);
  const [widthUnitValue, setWidthUnitValue] = useState<"percent" | "pixel">(
    widthUnit || "percent"
  );
  const [alignValue, setAlignValue] = useState<"left" | "center" | "right">(
    align || "center"
  );
  const [isResizing, setIsResizing] = useState(false);
  const [imageNaturalWidth, setImageNaturalWidth] = useState<number | null>(
    null
  );
  const [imageNaturalHeight, setImageNaturalHeight] = useState<number | null>(
    null
  );
  const figureRef = useRef<HTMLElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const portalContainer = useFloatingPortalContainer();

  // Sync local state with node attributes when they change externally
  useEffect(() => {
    setAltValue(alt || "");
    setCaptionValue(caption || "");
    setHrefValue(href || "");
    setWidthValue(width || "100");
    setHeightValue(height || null);
    setWidthUnitValue(widthUnit || "percent");
    setAlignValue(align || "center");
  }, [alt, caption, href, width, height, widthUnit, align]);

  // Load actual image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageNaturalWidth(img.naturalWidth);
      setImageNaturalHeight(img.naturalHeight);
      // Store height if not already set
      if (!height) {
        updateAttributes({ height: String(img.naturalHeight) });
      }
    };
    img.src = src;
  }, [src, height, updateAttributes]);

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
    // Validate and clamp on blur
    const numValue = Number.parseInt(widthValue, 10) || 100;
    const minValue = widthUnitValue === "percent" ? 10 : 50;

    // Calculate max value based on actual image width and container
    let maxValue: number;
    if (widthUnitValue === "percent") {
      maxValue = 100;
    } else {
      // For pixels, use the smaller of: image natural width or container width
      const containerWidth =
        figureRef.current?.parentElement?.clientWidth || 800;
      maxValue = imageNaturalWidth
        ? Math.min(imageNaturalWidth, containerWidth)
        : containerWidth;
    }

    const clampedValue = Math.max(minValue, Math.min(maxValue, numValue));
    const finalWidth = String(clampedValue);

    setWidthValue(finalWidth);
    updateAttributes({ width: finalWidth });
  }, [widthValue, widthUnitValue, imageNaturalWidth, updateAttributes]);

  const handleWidthUnitChange = useCallback(
    (newUnit: "percent" | "pixel") => {
      setWidthUnitValue(newUnit);
      // Convert width value when switching units
      const currentNum = Number.parseInt(widthValue, 10) || 100;
      const containerWidth =
        figureRef.current?.parentElement?.clientWidth || 800;
      let newWidth = widthValue;

      if (newUnit === "pixel" && widthUnitValue === "percent") {
        // Converting from % to px - use actual container width
        newWidth = String(Math.round((currentNum / 100) * containerWidth));
      } else if (newUnit === "percent" && widthUnitValue === "pixel") {
        // Converting from px to %
        newWidth = String(Math.round((currentNum / containerWidth) * 100));
      }

      setWidthValue(newWidth);
      updateAttributes({ width: newWidth, widthUnit: newUnit });
    },
    [updateAttributes, widthValue, widthUnitValue]
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

      let newWidth: number;
      if (widthUnitValue === "percent") {
        const deltaPercent = (deltaX / containerWidth) * 100;
        newWidth = Math.max(
          10,
          Math.min(100, startWidthRef.current + deltaPercent)
        );
      } else {
        // For pixels, respect image natural width and container width
        const maxPixelWidth = imageNaturalWidth
          ? Math.min(imageNaturalWidth, containerWidth)
          : containerWidth;
        newWidth = Math.max(
          50,
          Math.min(maxPixelWidth, startWidthRef.current + deltaX)
        );
      }

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
  }, [isResizing, updateAttributes, widthUnitValue, imageNaturalWidth]);

  // Calculate alignment styles
  const alignmentStyles: React.CSSProperties = {
    width: widthUnitValue === "percent" ? `${widthValue}%` : `${widthValue}px`,
    marginLeft: alignValue === "left" ? 0 : "auto",
    marginRight: alignValue === "right" ? 0 : "auto",
  };

  return (
    <NodeViewWrapper data-drag-handle>
      <Popover open={selected}>
        <PopoverTrigger asChild>
          <figure
            className={cn(
              "relative my-4",
              selected && "outline-2 outline-primary outline-offset-2"
            )}
            ref={figureRef}
            style={alignmentStyles}
          >
            {/* Render image wrapped in anchor if href exists */}
            {href ? (
              <a href={href} rel="noopener noreferrer" target="_blank">
                {/* biome-ignore lint: Tiptap NodeView requires standard img element */}
                <img
                  alt={altValue}
                  className="h-auto w-full rounded-md border border-muted"
                  src={src}
                />
              </a>
            ) : (
              /* biome-ignore lint: Tiptap NodeView requires standard img element */
              <img
                alt={altValue}
                className="h-auto w-full rounded-md border border-muted"
                src={src}
              />
            )}

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
                {caption}
              </figcaption>
            )}
          </figure>
        </PopoverTrigger>

        {/* Toolbar in Popover - only shown when selected */}
        <PopoverContent
          align="start"
          className="flex w-80 flex-col gap-3 p-3"
          container={portalContainer}
          side="right"
          sideOffset={18}
        >
          {/* Width Controls */}
          <div className="space-y-1.5">
            <Label className="font-medium text-xs" htmlFor="image-width">
              Width
            </Label>
            <div className="flex gap-2">
              <Input
                className="h-8 flex-1 text-sm"
                id="image-width"
                onBlur={handleWidthBlur}
                onChange={handleWidthChange}
                placeholder="100"
                type="text"
                value={widthValue}
              />
              <div className="flex gap-0">
                <Button
                  className="h-8 rounded-r-none px-3 text-xs data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                  data-active={widthUnitValue === "percent"}
                  onClick={() => handleWidthUnitChange("percent")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  %
                </Button>
                <Button
                  className="h-8 rounded-l-none px-3 text-xs data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                  data-active={widthUnitValue === "pixel"}
                  onClick={() => handleWidthUnitChange("pixel")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  px
                </Button>
              </div>
            </div>
          </div>

          {/* Alignment Controls */}
          <div className="space-y-1.5">
            <Label className="font-medium text-xs">Alignment</Label>
            <div className="flex gap-0.5">
              <Button
                className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                data-active={alignValue === "left"}
                onClick={() => handleAlignChange("left")}
                size="icon"
                type="button"
                variant="ghost"
              >
                <AlignLeft className="size-4" />
              </Button>
              <Button
                className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                data-active={alignValue === "center"}
                onClick={() => handleAlignChange("center")}
                size="icon"
                type="button"
                variant="ghost"
              >
                <AlignCenter className="size-4" />
              </Button>
              <Button
                className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                data-active={alignValue === "right"}
                onClick={() => handleAlignChange("right")}
                size="icon"
                type="button"
                variant="ghost"
              >
                <AlignRight className="size-4" />
              </Button>
            </div>
          </div>

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
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
};
