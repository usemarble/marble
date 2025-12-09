"use client"

import * as React from "react"
import { Collapsible as BaseCollapsible } from "@base-ui-components/react/collapsible"

import { cn } from "@marble/ui/lib/utils"

const Collapsible = (props: BaseCollapsible.Root.Props) => {
  return <BaseCollapsible.Root data-slot="collapsible" {...props} />
}

const CollapsibleTrigger = (props: BaseCollapsible.Trigger.Props) => {
  return <BaseCollapsible.Trigger data-slot="collapsible-trigger" {...props} />
}

const CollapsibleContent = (props: BaseCollapsible.Panel.Props) => {
  const { className, ...rest } = props

  return (
    <BaseCollapsible.Panel
      data-slot="collapsible-content"
      className={cn(
        "h-[var(--collapsible-panel-height)] overflow-hidden text-sm transition-all duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0",
        className
      )}
      {...rest}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
