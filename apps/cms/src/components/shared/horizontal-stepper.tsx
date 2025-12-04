"use client";

import { cn } from "@marble/ui/lib/utils";
import { CheckIcon, CircleNotchIcon, XIcon } from "@phosphor-icons/react";

export type HorizontalStepStatus =
  | "pending"
  | "active"
  | "completed"
  | "error";

export type HorizontalStepItem = {
  id: string;
  label: string;
  status: HorizontalStepStatus;
};

type HorizontalStepperProps = {
  steps: HorizontalStepItem[];
  className?: string;
};

export function HorizontalStepper({
  steps,
  className,
}: HorizontalStepperProps) {
  return (
    <div className={cn("flex w-full items-center justify-between", className)}>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className="flex flex-1 items-center"
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                step.status === "completed" &&
                  "border-emerald-500 bg-emerald-500 text-white",
                step.status === "active" &&
                  "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25",
                step.status === "pending" &&
                  "border-muted-foreground/20 bg-muted/50 text-muted-foreground",
                step.status === "error" &&
                  "border-destructive bg-destructive text-destructive-foreground"
              )}
            >
              {step.status === "completed" ? (
                <CheckIcon className="size-5" weight="bold" />
              ) : step.status === "active" ? (
                <CircleNotchIcon className="size-5 animate-spin" />
              ) : step.status === "error" ? (
                <XIcon className="size-5" weight="bold" />
              ) : (
                <span className="font-medium text-sm">{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "whitespace-nowrap font-medium text-xs transition-colors",
                step.status === "completed" && "text-emerald-600",
                step.status === "active" && "text-foreground",
                step.status === "pending" && "text-muted-foreground",
                step.status === "error" && "text-destructive"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-3 h-0.5 flex-1 rounded-full transition-colors duration-500",
                step.status === "completed"
                  ? "bg-emerald-500"
                  : "bg-muted-foreground/20"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}


