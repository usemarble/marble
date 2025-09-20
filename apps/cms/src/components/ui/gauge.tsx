"use client";

import { cn } from "@marble/ui/lib/utils";
import { motion } from "motion/react";
import { nanoid } from "nanoid";
import { useId } from "react";

type GaugeProps = {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  colors?: string[];
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  formatValue?: (value: number) => string;
  onAnimationComplete?: () => void;
  animate?: boolean;
};

export function Gauge({
  value,
  min = 0,
  max = 100,
  label,
  size = 200,
  strokeWidth = 12,
  colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"],
  className,
  valueClassName,
  labelClassName,
  formatValue = (val) => val.toFixed(1),
  onAnimationComplete,
  animate = true,
}: GaugeProps) {
  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = (normalizedValue - min) / (max - min);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const startAngle = Math.PI;
  const endAngle = 0;

  const createArcPath = (
    startAngle: number,
    endAngle: number,
    radius: number
  ) => {
    const start = {
      x: center + radius * Math.cos(startAngle),
      y: center + radius * Math.sin(startAngle),
    };
    const end = {
      x: center + radius * Math.cos(endAngle),
      y: center + radius * Math.sin(endAngle),
    };

    const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const fullArcPath = createArcPath(startAngle, endAngle, radius);
  const gradientId = useId();
  const circumference = Math.PI * radius;

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
    >
      <svg
        width={size}
        height={size * 0.6}
        viewBox={`0 0 ${size} ${size * 0.6}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {colors.map((color, index) => (
              <stop
                key={nanoid()}
                offset={`${(index / (colors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>

        <path
          d={fullArcPath}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.15}
        />

        <motion.path
          d={fullArcPath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={
            animate
              ? { strokeDashoffset: circumference }
              : { strokeDashoffset: circumference * (1 - percentage) }
          }
          animate={{ strokeDashoffset: circumference * (1 - percentage) }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            delay: 0.2,
          }}
          onAnimationComplete={onAnimationComplete}
        />
      </svg>

      <div className="absolute inset-0 mt-8 flex flex-col items-center justify-center">
        <motion.div
          className={cn("font-bold text-4xl text-foreground", valueClassName)}
          initial={
            animate ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }
          }
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <motion.span
            initial={animate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            {formatValue(normalizedValue)}
          </motion.span>
        </motion.div>
        {label && (
          <motion.div
            className={cn("mt-1 text-muted-foreground text-sm", labelClassName)}
            initial={animate ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {label}
          </motion.div>
        )}
      </div>
    </div>
  );
}
