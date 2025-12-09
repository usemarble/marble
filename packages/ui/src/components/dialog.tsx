"use client"

import * as React from "react"
import { Dialog as BaseDialog } from "@base-ui-components/react"
import { XIcon } from "lucide-react"

import { cn } from "@marble/ui/lib/utils"

const Dialog = (props: React.ComponentProps<typeof BaseDialog.Root>) => {
  return <BaseDialog.Root data-slot="dialog" {...props} />
}

const DialogTrigger = (props: React.ComponentProps<typeof BaseDialog.Trigger>) => {
  return <BaseDialog.Trigger data-slot="dialog-trigger" {...props} />
}

const DialogPortal = (props: React.ComponentProps<typeof BaseDialog.Portal>) => {
  return <BaseDialog.Portal data-slot="dialog-portal" {...props} />
}

const DialogClose = (props: React.ComponentProps<typeof BaseDialog.Close>) => {
  return <BaseDialog.Close data-slot="dialog-close" {...props} />
}

const DialogOverlay = (props: React.ComponentProps<typeof BaseDialog.Backdrop>) => {
  const { className, ...rest } = props

  return (
    <BaseDialog.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-200 [&[data-ending-style]]:opacity-0 [&[data-starting-style]]:opacity-0",
        className
      )}
      {...rest}
    />
  )
}

type DialogContentProps = React.ComponentProps<typeof BaseDialog.Popup> & {
  showCloseButton?: boolean
}

const DialogContent = (props: DialogContentProps) => {
  const { className, children, showCloseButton = false, ...rest } = props

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <BaseDialog.Popup
        data-slot="dialog-content"
        className={cn(
          "bg-popover text-popover-foreground fixed z-50 grid w-full sm:max-w-[calc(100%-2rem)]",
          "gap-4 rounded-2xl border p-6 shadow-lg duration-200 outline-none sm:max-w-lg sm:scale-[calc(1-0.1*var(--nested-dialogs))]",
          "fixed bottom-0 w-full sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
          "duration-200",
          "data-[starting-style]:translate-y-full data-[starting-style]:opacity-0",
          "data-[ending-style]:translate-y-full data-[ending-style]:opacity-0",
          "data-[starting-style]:sm:translate-y-[-50%] data-[starting-style]:sm:scale-95",
          "data-[ending-style]:sm:translate-y-[-50%] data-[ending-style]:sm:scale-95",
          className
        )}
        {...rest}
      >
        {children}
        {showCloseButton && <DialogX />}
      </BaseDialog.Popup>
    </DialogPortal>
  )
}

const DialogHeader = (props: React.ComponentProps<"div">) => {
  const { className, ...rest } = props

  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...rest}
    />
  )
}

const DialogFooter = (props: React.ComponentProps<"div">) => {
  const { className, ...rest } = props

  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...rest}
    />
  )
}

const DialogTitle = (props: React.ComponentProps<typeof BaseDialog.Title>) => {
  const { className, ...rest } = props

  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn("font-semibold text-lg leading-none", className)}
      {...rest}
    />
  )
}

const DialogDescription = (props: React.ComponentProps<typeof BaseDialog.Description>) => {
  const { className, ...rest } = props

  return (
    <BaseDialog.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...rest}
    />
  )
}

type DialogXProps = React.ComponentProps<typeof BaseDialog.Close> & {
  icon?: React.ReactNode
}

const DialogX = (props: DialogXProps) => {
  const { className, icon, ...rest } = props

  return (
    <BaseDialog.Close
      className={cn(
        "ring-offset-popover focus:ring-ring text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-[3px] focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      data-slot="dialog-close"
      {...rest}
    >
      {icon || <XIcon />}
      <span className="sr-only">Close</span>
    </BaseDialog.Close>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogX,
}
