"use client"

import * as React from "react"
import { Switch as BaseSwitch } from "@base-ui-components/react/switch"

import { cn } from "@marble/ui/lib/utils"

const Switch = (props: React.ComponentProps<typeof BaseSwitch.Root>) => {
  const { className, ...rest } = props

  return (
    <BaseSwitch.Root
      data-slot="switch"
      className={cn(
        "peer data-[checked]:bg-primary data-[unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...rest}
    >
      <BaseSwitch.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[unchecked]:bg-foreground dark:data-[checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[checked]:translate-x-[calc(100%-2px)] data-[unchecked]:translate-x-0"
        )}
      />
    </BaseSwitch.Root>
  )
}

export { Switch }
