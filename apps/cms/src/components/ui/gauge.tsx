"use client";

import { cn } from "@marble/ui/lib/utils";

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  /** Accessible name for the gauge. */
  label?: string;
  size?: number;
  className?: string;
  valueClassName?: string;
  formatValue?: (value: number) => string;
}

// Each zone covers an equal third of the arc. Unlit bars keep a faint tint of
// their zone so the whole scale stays readable at any score.
const ZONES = [
  { lit: "fill-red-500", unlit: "fill-red-500/12", dot: "bg-red-500" },
  {
    lit: "fill-yellow-500",
    unlit: "fill-yellow-500/12",
    dot: "bg-yellow-500",
  },
  { lit: "fill-green-500", unlit: "fill-green-500/12", dot: "bg-green-500" },
] as const;

const BARS_PER_ZONE = 7;
const BAR_COUNT = ZONES.length * BARS_PER_ZONE;

// Geometry in viewBox units: a half circle centred at (CX, CY) whose bars run
// from INNER_RADIUS out to INNER_RADIUS + BAR_LENGTH. The value's baseline
// sits on the bottom edge of the flat end bars, and the view extends a little
// past it so round digits that overshoot the baseline are not clipped.
const VIEW_WIDTH = 200;
const BAR_THICKNESS = 6;
const CX = VIEW_WIDTH / 2;
const CY = 96;
const VALUE_BASELINE = CY + BAR_THICKNESS / 2;
const VALUE_OVERSHOOT = 4;
const VIEW_HEIGHT = VALUE_BASELINE + VALUE_OVERSHOOT;
const INNER_RADIUS = 72;
const BAR_LENGTH = 20;
const VALUE_FONT_SIZE = 40;

const BARS = ZONES.flatMap((zone, zoneIndex) =>
  Array.from({ length: BARS_PER_ZONE }, (_, barIndex) => {
    const index = zoneIndex * BARS_PER_ZONE + barIndex;
    return {
      id: index,
      zone,
      // Spread the bars from -180deg (pointing left) to 0deg (pointing
      // right) so the end bars sit flat on the diameter.
      angle: (index / (BAR_COUNT - 1)) * 180 - 180,
    };
  })
);

function getLitCount(value: number, min: number, max: number) {
  const normalizedValue = Math.max(min, Math.min(max, value));
  return Math.round(((normalizedValue - min) / (max - min)) * BAR_COUNT);
}

/** Background class for the zone of the last lit bar, e.g. for a legend dot. */
export function getGaugeZoneClass(value: number, min = 0, max = 100) {
  return BARS[getLitCount(value, min, max) - 1]?.zone.dot ?? ZONES[0].dot;
}

export function Gauge({
  value,
  min = 0,
  max = 100,
  label = "Gauge",
  size = 200,
  className,
  valueClassName,
  formatValue = (val) => Math.round(val).toString(),
}: GaugeProps) {
  const normalizedValue = Math.max(min, Math.min(max, value));
  const litCount = getLitCount(value, min, max);
  const formattedValue = formatValue(normalizedValue);

  return (
    <svg
      className={className}
      height={(size * VIEW_HEIGHT) / VIEW_WIDTH}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      width={size}
    >
      <title>{`${label}: ${formattedValue}`}</title>
      {BARS.map((bar) => (
        <rect
          className={cn(
            "transition-colors duration-300",
            bar.id < litCount ? bar.zone.lit : bar.zone.unlit
          )}
          height={BAR_THICKNESS}
          key={bar.id}
          rx={BAR_THICKNESS / 2}
          transform={`rotate(${bar.angle} ${CX} ${CY})`}
          width={BAR_LENGTH}
          x={CX + INNER_RADIUS}
          y={CY - BAR_THICKNESS / 2}
        />
      ))}
      <text
        className={cn(
          "fill-foreground font-medium tabular-nums",
          valueClassName
        )}
        fontSize={VALUE_FONT_SIZE}
        textAnchor="middle"
        x={CX}
        y={VALUE_BASELINE}
      >
        {formattedValue}
      </text>
    </svg>
  );
}
