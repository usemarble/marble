"use client"

import * as React from "react"
import { Separator as BaseSeparator } from "@base-ui-components/react/separator"

import { cn } from "@marble/ui/lib/utils"

const Separator = (props: React.ComponentProps<typeof BaseSeparator>) => {
  const { className, orientation = "horizontal", ...rest } = props

  return (
    <BaseSeparator
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...rest}
    />
  )
}

export { Separator }
