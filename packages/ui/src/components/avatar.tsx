"use client"

import * as React from "react"
import { Avatar as AvatarBase } from "@base-ui-components/react/avatar"

import { cn } from "@marble/ui/lib/utils"

const Avatar = (props: React.ComponentProps<typeof AvatarBase.Root>) => {
  const { className, ...rest } = props

  return (
    <AvatarBase.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...rest}
    />
  )
}

const AvatarImage = (props: React.ComponentProps<typeof AvatarBase.Image>) => {
  const { className, ...rest } = props

  return (
    <AvatarBase.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...rest}
    />
  )
}

const AvatarFallback = (props: React.ComponentProps<typeof AvatarBase.Fallback>) => {
  const { className, ...rest } = props

  return (
    <AvatarBase.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full select-none",
        className
      )}
      {...rest}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
