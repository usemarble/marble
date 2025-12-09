"use client"

import * as React from "react"
import { Tabs as BaseTabs } from "@base-ui-components/react/tabs"

import { cn } from "@marble/ui/lib/utils"

type TabsVariant = "default" | "line"

type TabsContextValue = {
  variant: TabsVariant
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

const useTabs = () => {
  const context = React.useContext(TabsContext)

  if (!context) {
    throw new Error("useTabs must be used within a Tabs")
  }

  return context
}

type TabsProps = React.ComponentProps<typeof BaseTabs.Root> & {
  variant?: TabsVariant
}

const Tabs = (props: TabsProps) => {
  const { variant = "default", className, ...rest } = props

  return (
    <TabsContext.Provider value={{ variant }}>
      <BaseTabs.Root
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...rest}
      />
    </TabsContext.Provider>
  )
}

const TabsList = (props: React.ComponentProps<typeof BaseTabs.List>) => {
  const { className, children, ...rest } = props
  const { variant } = useTabs()

  return (
    <BaseTabs.List
      data-slot="tabs-list"
      className={cn(
        "text-muted-foreground relative z-0 inline-flex items-center justify-center",
        variant === "default" && "bg-muted h-9 w-fit gap-x-1 rounded-lg p-[3px]",
        variant === "line" && "h-10 w-full border-b border-border",
        className
      )}
      {...rest}
    >
      {children}
      <TabIndicator />
    </BaseTabs.List>
  )
}

const TabsTrigger = (props: React.ComponentProps<typeof BaseTabs.Tab>) => {
  const { className, ...rest } = props
  const { variant } = useTabs()

  return (
    <BaseTabs.Tab
      data-slot="tabs-trigger"
      className={cn(
        "text-muted-foreground data-[selected]:text-foreground focus-visible:ring-ring/50 focus-visible:border-ring z-[1] inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-nowrap whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variant === "line" && "rounded-none px-4 py-2 hover:bg-muted data-[selected]:text-primary",
        className
      )}
      {...rest}
    />
  )
}

const TabIndicator = (props: React.ComponentProps<typeof BaseTabs.Indicator>) => {
  const { className, ...rest } = props
  const { variant } = useTabs()

  return (
    <BaseTabs.Indicator
      data-slot="tab-indicator"
      className={cn(
        "absolute left-0 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] transition-all duration-300 ease-in-out",
        variant === "line"
          ? "bg-primary bottom-0 z-10 h-0.5"
          : "bg-background dark:bg-input/30 dark:border-input top-1/2 -translate-y-1/2 -z-[1] h-[var(--active-tab-height)] rounded-md border shadow-sm",
        className
      )}
      {...rest}
    />
  )
}

const TabsContent = (props: React.ComponentProps<typeof BaseTabs.Panel>) => {
  const { className, ...rest } = props

  return (
    <BaseTabs.Panel
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...rest}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
