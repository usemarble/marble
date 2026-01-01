"use client";
import { cn } from "@marble/ui/lib/utils";
import { nanoid } from "nanoid";

interface SegmentedProgressProps {
  value: number;
  max?: number;
  segments?: number;
  className?: string;
  segmentClassName?: string;
  filledColor?: string;
  unfilledColor?: string;
  width?: number;
}

export function SegmentedProgress({
  value,
  max = 100,
  segments = 20,
  className,
  segmentClassName,
  filledColor = "bg-emerald-500",
  unfilledColor = "bg-gray-600",
  width = 320,
}: SegmentedProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const filledSegments = Math.round((percentage / 100) * segments);

  const gapWidth = 4;
  const totalGapWidth = (segments - 1) * gapWidth;
  const segmentWidth = Math.max(2, (width - totalGapWidth) / segments);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end gap-1" style={{ width: `${width}px` }}>
        {Array.from({ length: segments }, (_, index) => (
          <div
            className={cn(
              "h-8 rounded-sm transition-colors duration-200",
              index < filledSegments ? filledColor : unfilledColor,
              segmentClassName
            )}
            key={nanoid()}
            style={{ width: `${segmentWidth}px` }}
          />
        ))}
      </div>
    </div>
  );
}
