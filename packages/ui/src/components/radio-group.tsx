"use client"

import * as React from "react"
import { Radio } from "@base-ui-components/react/radio"
import { RadioGroup as BaseRadioGroup } from "@base-ui-components/react/radio-group"
import { CircleIcon } from "lucide-react"

import { cn } from "@marble/ui/lib/utils"

const RadioGroup = (props: React.ComponentProps<typeof BaseRadioGroup>) => {
  const { className, ...rest } = props

  return (
    <BaseRadioGroup
      data-slot="radio-group"
      className={cn("group grid gap-3", className)}
      {...rest}
    />
  )
}

const RadioGroupItem = (props: React.ComponentProps<typeof Radio.Root>) => {
  const { className, ...rest } = props

  return (
    <Radio.Root
      data-slot="radio-group-item"
      className={cn(
        "peer bg-input text-primary hover:border-ring/70 focus-visible:ring-ring/50 aria-invalid:ring-destructive/50 aria-invalid:border-destructive data-[checked]:border-primary dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow,border-color] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...rest}
    >
      <Radio.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </Radio.Indicator>
    </Radio.Root>
  )
}

export { RadioGroup, RadioGroupItem }
