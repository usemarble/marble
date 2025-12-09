"use client"

import * as React from "react"
import { Popover as BasePopover } from "@base-ui-components/react/popover"

import { cn } from "@marble/ui/lib/utils"

const Popover = (props: React.ComponentProps<typeof BasePopover.Root>) => {
  return <BasePopover.Root data-slot="popover" {...props} />
}

const PopoverPortal = (props: React.ComponentProps<typeof BasePopover.Portal>) => {
  return <BasePopover.Portal data-slot="popover-portal" {...props} />
}

const PopoverTrigger = (props: React.ComponentProps<typeof BasePopover.Trigger>) => {
  return <BasePopover.Trigger data-slot="popover-trigger" {...props} />
}

const PopoverClose = (props: React.ComponentProps<typeof BasePopover.Close>) => {
  return <BasePopover.Close data-slot="popover-close" {...props} />
}

const PopoverAnchor = (props: React.ComponentProps<typeof BasePopover.Anchor>) => {
  return <BasePopover.Anchor data-slot="popover-anchor" {...props} />
}

const PopoverPositioner = (props: React.ComponentProps<typeof BasePopover.Positioner>) => {
  return <BasePopover.Positioner data-slot="popover-positioner" {...props} />
}

type PopoverContentProps = React.ComponentProps<typeof BasePopover.Popup> & {
  align?: BasePopover.Positioner.Props["align"]
  sideOffset?: BasePopover.Positioner.Props["sideOffset"]
}

const PopoverContent = (props: PopoverContentProps) => {
  const { children, className, align = "center", sideOffset = 4, ...rest } = props

  return (
    <PopoverPortal>
      <PopoverPositioner className="z-50" sideOffset={sideOffset} align={align}>
        <BasePopover.Popup
          data-slot="popover-content"
          className={cn(
            "bg-popover text-popover-foreground z-50 w-72 origin-[var(--transform-origin)] rounded-md border p-4 shadow-md outline-hidden transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...rest}
        >
          {children}
        </BasePopover.Popup>
      </PopoverPositioner>
    </PopoverPortal>
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverClose,
  PopoverPortal,
  PopoverPositioner,
}
