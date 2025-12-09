"use client"

import * as React from "react"
import { Dialog as BaseSheet } from "@base-ui-components/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@marble/ui/lib/utils"

const Sheet = (props: React.ComponentProps<typeof BaseSheet.Root>) => {
  return <BaseSheet.Root data-slot="sheet" {...props} />
}

const SheetTrigger = (props: React.ComponentProps<typeof BaseSheet.Trigger>) => {
  return <BaseSheet.Trigger data-slot="sheet-trigger" {...props} />
}

const SheetClose = (props: React.ComponentProps<typeof BaseSheet.Close>) => {
  return <BaseSheet.Close data-slot="sheet-close" {...props} />
}

const SheetPortal = (props: React.ComponentProps<typeof BaseSheet.Portal>) => {
  return <BaseSheet.Portal data-slot="sheet-portal" {...props} />
}

const SheetOverlay = (props: React.ComponentProps<typeof BaseSheet.Backdrop>) => {
  const { className, ...rest } = props

  return (
    <BaseSheet.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-200 [&[data-ending-style]]:opacity-0 [&[data-starting-style]]:opacity-0",
        className
      )}
      {...rest}
    />
  )
}

type SheetContentProps = React.ComponentProps<typeof BaseSheet.Popup> & {
  showCloseButton?: boolean
  side?: "top" | "right" | "bottom" | "left"
}

const SheetContent = (props: SheetContentProps) => {
  const { className, children, showCloseButton = false, side = "right", ...rest } = props

  return (
    <SheetPortal>
      <SheetOverlay />
      <BaseSheet.Popup
        data-slot="sheet-content"
        className={cn(
          "bg-background text-foreground fixed z-50 flex flex-col gap-4 rounded-3xl shadow-lg outline-hidden transition ease-in-out data-[closed]:duration-300 data-[open]:duration-500",
          "top-[15px] bottom-[15px]",
          side === "right" &&
            "right-[15px] w-3/4 sm:max-w-md [&[data-ending-style]]:translate-x-full [&[data-starting-style]]:translate-x-full",
          side === "left" &&
            "left-[15px] w-3/4 sm:max-w-md [&[data-ending-style]]:-translate-x-full [&[data-starting-style]]:-translate-x-full",
          side === "top" &&
            "top-[15px] right-[15px] bottom-auto left-[15px] h-auto [&[data-ending-style]]:-translate-y-full [&[data-starting-style]]:-translate-y-full",
          side === "bottom" &&
            "top-auto right-[15px] bottom-[15px] left-[15px] h-auto [&[data-ending-style]]:translate-y-full [&[data-starting-style]]:translate-y-full",
          className
        )}
        {...rest}
      >
        {children}
        {showCloseButton && <SheetX />}
      </BaseSheet.Popup>
    </SheetPortal>
  )
}

const SheetHeader = (props: React.ComponentProps<"div">) => {
  const { className, ...rest } = props

  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...rest}
    />
  )
}

const SheetFooter = (props: React.ComponentProps<"div">) => {
  const { className, ...rest } = props

  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...rest}
    />
  )
}

const SheetTitle = (props: React.ComponentProps<typeof BaseSheet.Title>) => {
  const { className, ...rest } = props

  return (
    <BaseSheet.Title
      data-slot="sheet-title"
      className={cn("font-semibold text-foreground", className)}
      {...rest}
    />
  )
}

const SheetDescription = (props: React.ComponentProps<typeof BaseSheet.Description>) => {
  const { className, ...rest } = props

  return (
    <BaseSheet.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...rest}
    />
  )
}

type SheetXProps = React.ComponentProps<typeof BaseSheet.Close> & {
  icon?: React.ReactNode
}

const SheetX = (props: SheetXProps) => {
  const { className, icon, ...rest } = props

  return (
    <BaseSheet.Close
      className={cn(
        "ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-[3px] focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      data-slot="sheet-close"
      {...rest}
    >
      {icon || <XIcon className="size-4" />}
      <span className="sr-only">Close</span>
    </BaseSheet.Close>
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetX,
}
