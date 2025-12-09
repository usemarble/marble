"use client"

import * as React from "react"
import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip"

import { cn } from "@marble/ui/lib/utils"

const TooltipProvider = (props: React.ComponentProps<typeof BaseTooltip.Provider>) => {
  const { delay = 0, closeDelay = 0, ...rest } = props

  return (
    <BaseTooltip.Provider
      data-slot="tooltip-provider"
      delay={delay}
      closeDelay={closeDelay}
      {...rest}
    />
  )
}

const Tooltip = (props: React.ComponentProps<typeof BaseTooltip.Root>) => {
  return <BaseTooltip.Root data-slot="tooltip" {...props} />
}

const TooltipTrigger = (props: React.ComponentProps<typeof BaseTooltip.Trigger>) => {
  return <BaseTooltip.Trigger data-slot="tooltip-trigger" {...props} />
}

const TooltipPortal = (props: React.ComponentProps<typeof BaseTooltip.Portal>) => {
  return <BaseTooltip.Portal data-slot="tooltip-portal" {...props} />
}

const TooltipPositioner = (props: React.ComponentProps<typeof BaseTooltip.Positioner>) => {
  return <BaseTooltip.Positioner data-slot="tooltip-positioner" {...props} />
}

const TooltipArrow = (props: React.ComponentProps<typeof BaseTooltip.Arrow>) => {
  return <BaseTooltip.Arrow data-slot="tooltip-arrow" {...props} />
}

type TooltipContentProps = React.ComponentProps<typeof BaseTooltip.Popup> & {
  align?: BaseTooltip.Positioner.Props["align"]
  side?: BaseTooltip.Positioner.Props["side"]
  sideOffset?: BaseTooltip.Positioner.Props["sideOffset"]
}

const TooltipContent = (props: TooltipContentProps) => {
  const { className, align = "center", sideOffset = 8, side = "top", children, ...rest } = props

  return (
    <TooltipPortal>
      <TooltipPositioner className="z-50" sideOffset={sideOffset} align={align} side={side}>
        <BaseTooltip.Popup
          data-slot="tooltip-content"
          className={cn(
            "bg-primary text-primary-foreground z-50 w-fit origin-[var(--transform-origin)] rounded-md px-3 py-1.5 text-xs text-balance shadow-sm transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[instant]:transition-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...rest}
        >
          {children}
          <TooltipArrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
            <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
              <path
                d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V9H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
                className="fill-primary"
              />
            </svg>
          </TooltipArrow>
        </BaseTooltip.Popup>
      </TooltipPositioner>
    </TooltipPortal>
  )
}

const TooltipPopup = (props: React.ComponentProps<typeof BaseTooltip.Popup>) => {
  const { className, children, ...rest } = props

  return (
    <BaseTooltip.Popup
      data-slot="tooltip-popup"
      className={cn(
        "bg-primary text-primary-foreground z-50 w-fit origin-[var(--transform-origin)] rounded-md px-3 py-1.5 text-xs text-balance shadow-sm transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[instant]:transition-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
        className
      )}
      {...rest}
    >
      {children}
      <TooltipArrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
          <path
            d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V9H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
            className="fill-primary"
          />
        </svg>
      </TooltipArrow>
    </BaseTooltip.Popup>
  )
}

const TooltipViewport = (props: React.ComponentProps<typeof BaseTooltip.Viewport>) => {
  const { className, ...rest } = props

  return (
    <BaseTooltip.Viewport
      data-slot="tooltip-viewport"
      className={cn(
        "relative h-full w-full overflow-clip [&_[data-current]]:opacity-100 [&_[data-current]]:translate-x-0 [&_[data-current]]:transition-[translate,opacity] [&_[data-current]]:duration-200 [&_[data-previous]]:opacity-100 [&_[data-previous]]:translate-x-0 [&_[data-previous]]:transition-[translate,opacity] [&_[data-previous]]:duration-200 [[data-instant]_&_[data-current]]:transition-none [[data-instant]_&_[data-previous]]:transition-none data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:-translate-x-1/2 data-[activation-direction~='left']:[&_[data-current][data-starting-style]]:opacity-0 data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:translate-x-1/2 data-[activation-direction~='right']:[&_[data-current][data-starting-style]]:opacity-0 data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:translate-x-1/2 data-[activation-direction~='left']:[&_[data-previous][data-ending-style]]:opacity-0 data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:-translate-x-1/2 data-[activation-direction~='right']:[&_[data-previous][data-ending-style]]:opacity-0",
        className
      )}
      {...rest}
    />
  )
}

const createTooltipHandle = BaseTooltip.createHandle

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipPortal,
  TooltipPositioner,
  TooltipPopup,
  TooltipViewport,
  TooltipArrow,
  createTooltipHandle,
}
