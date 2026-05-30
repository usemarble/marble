import { cn } from "@marble/ui/lib/utils";
import styles from "./activity-indicator.module.css";

const segments = Array.from({ length: 12 }, (_, index) => ({
  animationDelay: `${-1.2 + index * 0.1}s`,
  id: `segment-${index}`,
  transform: `rotate(${index * 30}deg) translate(120%)`,
}));

export function ActivityIndicator({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative size-5 text-muted-foreground", className)}
    >
      <div className="absolute top-1/2 left-1/2 size-full">
        {segments.map((segment) => (
          <span
            className={cn(
              styles.segment,
              "-top-[4%] -left-[10%] absolute h-[8%] w-[30%] rounded-full bg-current"
            )}
            key={segment.id}
            style={{
              animationDelay: segment.animationDelay,
              transform: segment.transform,
            }}
          />
        ))}
      </div>
    </div>
  );
}
