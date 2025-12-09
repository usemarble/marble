"use client"

import * as React from "react"
import { Menu as BaseMenu } from "@base-ui-components/react/menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@marble/ui/lib/utils"

const DropdownMenu = (props: React.ComponentProps<typeof BaseMenu.Root>) => {
  return <BaseMenu.Root data-slot="dropdown-menu" {...props} />
}

const DropdownMenuPortal = (props: React.ComponentProps<typeof BaseMenu.Portal>) => {
  return <BaseMenu.Portal data-slot="dropdown-menu-portal" {...props} />
}

const DropdownMenuTrigger = (props: React.ComponentProps<typeof BaseMenu.Trigger>) => {
  return <BaseMenu.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

const DropdownMenuPositioner = (props: React.ComponentProps<typeof BaseMenu.Positioner>) => {
  return <BaseMenu.Positioner data-slot="dropdown-menu-positioner" {...props} />
}

type DropdownMenuContentProps = React.ComponentProps<typeof BaseMenu.Popup> & {
  align?: BaseMenu.Positioner.Props["align"]
  sideOffset?: BaseMenu.Positioner.Props["sideOffset"]
  side?: BaseMenu.Positioner.Props["side"]
}

const DropdownMenuContent = (props: DropdownMenuContentProps) => {
  const { className, sideOffset = 4, align = "center", side = "bottom", ...rest } = props

  return (
    <DropdownMenuPortal>
      <DropdownMenuPositioner
        className="z-50 max-h-[var(--available-height)]"
        sideOffset={sideOffset}
        side={side}
        align={align}
      >
        <BaseMenu.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "bg-popover text-popover-foreground z-50 max-h-[var(--available-height)] min-w-[8rem] origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...rest}
        />
      </DropdownMenuPositioner>
    </DropdownMenuPortal>
  )
}

const DropdownMenuGroup = (props: React.ComponentProps<typeof BaseMenu.Group>) => {
  return <BaseMenu.Group data-slot="dropdown-menu-group" {...props} />
}

type DropdownMenuItemProps = React.ComponentProps<typeof BaseMenu.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}

const DropdownMenuItem = (props: DropdownMenuItemProps) => {
  const { className, inset, variant = "default", ...rest } = props

  return (
    <BaseMenu.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent cursor-pointer disabled:cursor-not-allowed focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...rest}
    />
  )
}

const DropdownMenuShortcut = (props: React.ComponentProps<"span">) => {
  const { className, ...rest } = props

  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...rest}
    />
  )
}

const DropdownMenuSeparator = (props: React.ComponentProps<typeof BaseMenu.Separator>) => {
  const { className, ...rest } = props

  return (
    <BaseMenu.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...rest}
    />
  )
}

type DropdownMenuLabelProps = React.ComponentProps<typeof BaseMenu.GroupLabel> & {
  inset?: boolean
}

const DropdownMenuLabel = (props: DropdownMenuLabelProps) => {
  const { className, inset, ...rest } = props

  return (
    <BaseMenu.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...rest}
    />
  )
}

const DropdownMenuCheckboxItem = (props: React.ComponentProps<typeof BaseMenu.CheckboxItem>) => {
  const { className, children, checked, ...rest } = props

  return (
    <BaseMenu.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...rest}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <BaseMenu.CheckboxItemIndicator>
          <CheckIcon className="size-4" />
        </BaseMenu.CheckboxItemIndicator>
      </span>
      {children}
    </BaseMenu.CheckboxItem>
  )
}

const DropdownMenuRadioGroup = (props: React.ComponentProps<typeof BaseMenu.RadioGroup>) => {
  return <BaseMenu.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

const DropdownMenuRadioItem = (props: React.ComponentProps<typeof BaseMenu.RadioItem>) => {
  const { className, children, ...rest } = props

  return (
    <BaseMenu.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...rest}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <BaseMenu.RadioItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </BaseMenu.RadioItemIndicator>
      </span>
      {children}
    </BaseMenu.RadioItem>
  )
}

const DropdownMenuSub = (props: React.ComponentProps<typeof BaseMenu.SubmenuRoot>) => {
  return (
    <BaseMenu.SubmenuRoot
      closeDelay={0}
      delay={0}
      data-slot="dropdown-menu-sub"
      {...props}
    />
  )
}

type DropdownMenuSubTriggerProps = React.ComponentProps<typeof BaseMenu.SubmenuTrigger> & {
  inset?: boolean
}

const DropdownMenuSubTrigger = (props: DropdownMenuSubTriggerProps) => {
  const { className, inset, children, ...rest } = props

  return (
    <BaseMenu.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[popup-open]:bg-accent data-[popup-open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className
      )}
      {...rest}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </BaseMenu.SubmenuTrigger>
  )
}

type DropdownMenuSubContentProps = React.ComponentProps<typeof BaseMenu.Popup> & {
  align?: BaseMenu.Positioner.Props["align"]
  sideOffset?: BaseMenu.Positioner.Props["sideOffset"]
}

const DropdownMenuSubContent = (props: DropdownMenuSubContentProps) => {
  const { className, sideOffset = 0, align = "start", ...rest } = props

  return (
    <DropdownMenuPortal>
      <DropdownMenuPositioner
        className="z-50 max-h-[var(--available-height)]"
        sideOffset={sideOffset}
        align={align}
      >
        <BaseMenu.Popup
          data-slot="dropdown-menu-sub-content"
          className={cn(
            "bg-popover text-popover-foreground z-50 min-w-[8rem] origin-[var(--transform-origin)] overflow-hidden rounded-lg border p-1 shadow-md transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...rest}
        />
      </DropdownMenuPositioner>
    </DropdownMenuPortal>
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
