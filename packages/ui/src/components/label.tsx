"use client"

import * as React from "react"

import { cn } from "@marble/ui/lib/utils"

const Label = (props: React.ComponentProps<"label">) => {
  const { className, ...rest } = props

  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...rest}
    />
  )
}

export { Label }
