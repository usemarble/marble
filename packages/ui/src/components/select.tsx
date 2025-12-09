"use client"

import * as React from "react"
import { Select as BaseSelect } from "@base-ui-components/react/select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@marble/ui/lib/utils"

const Select = (props: React.ComponentProps<typeof BaseSelect.Root>) => {
  return <BaseSelect.Root data-slot="select" {...props} />
}

const SelectGroup = (props: React.ComponentProps<typeof BaseSelect.Group>) => {
  return <BaseSelect.Group data-slot="select-group" {...props} />
}

const SelectPortal = (props: React.ComponentProps<typeof BaseSelect.Portal>) => {
  return <BaseSelect.Portal data-slot="select-portal" {...props} />
}

const SelectPositioner = (props: React.ComponentProps<typeof BaseSelect.Positioner>) => {
  return <BaseSelect.Positioner data-slot="select-positioner" {...props} />
}

const SelectValue = (props: React.ComponentProps<typeof BaseSelect.Value>) => {
  const { className, ...rest } = props

  return (
    <BaseSelect.Value
      data-slot="select-value"
      className={cn("text-sm", className)}
      {...rest}
    />
  )
}

type SelectTriggerProps = React.ComponentProps<typeof BaseSelect.Trigger> & {
  size?: "sm" | "default"
}

const SelectTrigger = (props: SelectTriggerProps) => {
  const { className, size = "default", children, ...rest } = props

  return (
    <BaseSelect.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "group [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/50 aria-invalid:border-destructive bg-input hover:border-ring/70 flex w-fit items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow,border-color] outline-none select-none focus-visible:ring-[3px] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 data-[popup-open]:[&_*[data-slot=select-icon]]:rotate-180 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...rest}
    >
      {children}
      <BaseSelect.Icon>
        <ChevronDownIcon
          data-slot="select-icon"
          className="size-4 opacity-50 transition-transform duration-200"
        />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  )
}

type SelectContentProps = React.ComponentProps<typeof BaseSelect.Popup> & {
  sideOffset?: BaseSelect.Positioner.Props["sideOffset"]
  position?: "popper" | "item-aligned"
}

const SelectContent = (props: SelectContentProps) => {
  const { className, children, sideOffset = 4, position = "popper", ...rest } = props

  return (
    <SelectPortal>
      <SelectPositioner
        className="z-50"
        sideOffset={sideOffset}
        alignItemWithTrigger={position === "item-aligned"}
      >
        <SelectScrollUpButton />
        <BaseSelect.Popup
          data-slot="select-content"
          className={cn(
            "bg-popover text-popover-foreground z-50 relative max-h-[var(--available-height)] min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            position === "item-aligned" &&
              "[&_*[data-slot=select-item]]:min-w-[var(--anchor-width)]",
            className
          )}
          {...rest}
        >
          {children}
        </BaseSelect.Popup>
        <SelectScrollDownButton />
      </SelectPositioner>
    </SelectPortal>
  )
}

const SelectItem = (props: React.ComponentProps<typeof BaseSelect.Item>) => {
  const { className, children, ...rest } = props

  return (
    <BaseSelect.Item
      data-slot="select-item"
      className={cn(
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...rest}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <BaseSelect.ItemIndicator>
          <CheckIcon className="size-4" />
        </BaseSelect.ItemIndicator>
      </span>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  )
}

const SelectLabel = (props: React.ComponentProps<typeof BaseSelect.GroupLabel>) => {
  const { className, ...rest } = props

  return (
    <BaseSelect.GroupLabel
      data-slot="select-label"
      className={cn(
        "text-muted-foreground px-2 py-1.5 text-xs font-medium",
        className
      )}
      {...rest}
    />
  )
}

const SelectSeparator = (props: React.ComponentProps<typeof BaseSelect.Separator>) => {
  const { className, ...rest } = props

  return (
    <BaseSelect.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...rest}
    />
  )
}

const SelectScrollUpButton = (props: React.ComponentProps<typeof BaseSelect.ScrollUpArrow>) => {
  const { className, ...rest } = props

  return (
    <BaseSelect.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "bg-popover top-px left-[1px] z-[100] flex w-[calc(100%-2px)] cursor-default items-center justify-center rounded-t-md py-1",
        className
      )}
      {...rest}
    >
      <ChevronUpIcon className="size-4" />
    </BaseSelect.ScrollUpArrow>
  )
}

const SelectScrollDownButton = (props: React.ComponentProps<typeof BaseSelect.ScrollDownArrow>) => {
  const { className, ...rest } = props

  return (
    <BaseSelect.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bg-popover bottom-px left-[1px] z-[100] flex w-[calc(100%-2px)] cursor-default items-center justify-center rounded-b-md py-1",
        className
      )}
      {...rest}
    >
      <ChevronDownIcon className="size-4" />
    </BaseSelect.ScrollDownArrow>
  )
}

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
