"use client";

import { cn } from "@marble/ui/lib/utils";
import { CheckIcon, CircleNotchIcon } from "@phosphor-icons/react";

export type WorkflowStepStatus = "pending" | "active" | "completed" | "error";

export type WorkflowStepItem = {
  id: string;
  label: string;
  status: WorkflowStepStatus;
};

type WorkflowStepperProps = {
  steps: WorkflowStepItem[];
  className?: string;
};

export function WorkflowStepper({ steps, className }: WorkflowStepperProps) {
  return (
    <div className={cn("flex flex-col gap-0", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                step.status === "completed" &&
                  "border-emerald-500 bg-emerald-500 text-white",
                step.status === "active" &&
                  "border-primary bg-primary text-primary-foreground",
                step.status === "pending" &&
                  "border-muted-foreground/30 bg-muted text-muted-foreground",
                step.status === "error" &&
                  "border-destructive bg-destructive text-destructive-foreground"
              )}
            >
              {step.status === "completed" ? (
                <CheckIcon className="size-4" weight="bold" />
              ) : step.status === "active" ? (
                <CircleNotchIcon className="size-4 animate-spin" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-8 w-0.5 transition-colors",
                  step.status === "completed"
                    ? "bg-emerald-500"
                    : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
          <div className="flex min-h-8 flex-col justify-center pb-8">
            <p
              className={cn(
                "text-sm font-medium transition-colors",
                step.status === "completed" && "text-emerald-600",
                step.status === "active" && "text-foreground",
                step.status === "pending" && "text-muted-foreground",
                step.status === "error" && "text-destructive"
              )}
            >
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

