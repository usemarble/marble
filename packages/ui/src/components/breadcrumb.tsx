"use client"

import * as React from "react"
import { mergeProps } from "@base-ui-components/react"
import { useRender } from "@base-ui-components/react/use-render"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@marble/ui/lib/utils"

const Breadcrumb = (props: React.ComponentProps<"nav">) => {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

const BreadcrumbList = (props: React.ComponentProps<"ol">) => {
  const { className, ...rest } = props

  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...rest}
    />
  )
}

const BreadcrumbItem = (props: React.ComponentProps<"li">) => {
  const { className, ...rest } = props

  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...rest}
    />
  )
}

type BreadcrumbLinkProps = React.ComponentProps<"a"> & useRender.ComponentProps<"a">

const BreadcrumbLink = (props: BreadcrumbLinkProps) => {
  const { className, render = <a />, ...rest } = props

  const defaultProps = {
    "data-slot": "breadcrumb-link",
    className: cn("hover:text-foreground transition-colors", className),
  } as const

  const element = useRender({
    render,
    props: mergeProps<"a">(defaultProps, rest),
  })

  return element
}

const BreadcrumbPage = (props: React.ComponentProps<"span">) => {
  const { className, ...rest } = props

  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...rest}
    />
  )
}

const BreadcrumbSeparator = (props: React.ComponentProps<"li">) => {
  const { children, className, ...rest } = props

  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...rest}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

const BreadcrumbEllipsis = (props: React.ComponentProps<"span">) => {
  const { className, ...rest } = props

  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...rest}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
