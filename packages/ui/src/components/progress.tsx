"use client"

import * as React from "react"
import { Progress as BaseProgress } from "@base-ui-components/react/progress"

import { cn } from "@marble/ui/lib/utils"

const Progress = (props: React.ComponentProps<typeof BaseProgress.Root>) => {
  const { className, children, ...rest } = props

  return (
    <BaseProgress.Root data-slot="progress" className="relative" {...rest}>
      <BaseProgress.Track
        data-slot="progress-track"
        className={cn(
          "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
          className
        )}
      >
        <BaseProgress.Indicator
          data-slot="progress-indicator"
          className="bg-primary h-full w-full flex-1 transition-all"
        />
      </BaseProgress.Track>
      {children}
    </BaseProgress.Root>
  )
}

const ProgressValue = (props: React.ComponentProps<typeof BaseProgress.Value>) => {
  const { className, ...rest } = props

  return (
    <BaseProgress.Value
      data-slot="progress-value"
      className={cn(
        "text-foreground mt-2 flex justify-end text-sm font-medium",
        className
      )}
      {...rest}
    />
  )
}

export { Progress, ProgressValue }
