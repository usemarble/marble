"use client";

import { cn } from "@marble/ui/lib/utils";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";

type DashboardBodySize = "default" | "compact" | "wide";

interface DashboardBodyProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  contextView?: ReactNode;
  contextViewClassName?: string;
  flush?: boolean;
  header?: ReactNode;
  showHeader?: boolean;
  size?: DashboardBodySize;
  title?: ReactNode;
}

function getBodySizeClassName(size: DashboardBodySize) {
  switch (size) {
    case "compact":
      return "workspace-container-compact";
    case "wide":
      return "workspace-container-wide";
    default:
      return "workspace-container";
  }
}

export function DashboardBody({
  children,
  className,
  contentClassName,
  contextView,
  contextViewClassName,
  flush = false,
  header,
  showHeader = true,
  size = "default",
  title,
}: DashboardBodyProps) {
  if (flush) {
    return (
      <div className="flex h-svh max-h-svh w-full flex-col overflow-hidden bg-background">
        {showHeader ? (header ?? <PageHeader title={title} />) : null}
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div
            className={cn(
              "flex min-h-0 w-full min-w-0 flex-1 flex-col",
              className
            )}
          >
            {children}
          </div>
          {contextView ? (
            <aside
              className={cn(
                "flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-dashed bg-background lg:w-[360px] lg:border-t-0 lg:border-l",
                contextViewClassName
              )}
            >
              {contextView}
            </aside>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-col">
      {showHeader ? (header ?? <PageHeader title={title} />) : null}
      <section className="scrollbar-stable flex min-h-[calc(100vh-56px)] w-full flex-1 flex-col gap-4 px-4 py-2 md:px-6 lg:px-8 xl:px-12">
        <div className="flex w-full flex-1 flex-col gap-4 lg:flex-row">
          <div
            className={cn(
              getBodySizeClassName(size),
              "mx-auto flex h-full w-full min-w-0 flex-col py-8",
              contextView ? "lg:mx-0" : "mx-auto"
            )}
          >
            <div
              className={cn(
                "flex w-full flex-col",
                className,
                contentClassName
              )}
            >
              {children}
            </div>
          </div>
          {contextView ? (
            <aside
              className={cn(
                "w-full shrink-0 rounded-[20px] border bg-background lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-88px)] lg:w-[360px] lg:overflow-y-auto",
                contextViewClassName
              )}
            >
              {contextView}
            </aside>
          ) : null}
        </div>
      </section>
    </div>
  );
}
