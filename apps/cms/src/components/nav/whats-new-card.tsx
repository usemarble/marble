"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { useSidebar } from "@marble/ui/components/sidebar";
import { cn } from "@marble/ui/lib/utils";
import { XIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useLocalStorage } from "@/hooks/use-localstorage";

export function WhatsNewCard() {
  const { state } = useSidebar();
  const params = useParams<{ workspace: string }>();
  const [isDismissed, setIsDismissed] = useLocalStorage(
    "sidebar-whats-new-custom-fields-dismissed",
    false
  );
  const isCollapsed = state === "collapsed";
  const shouldReduceMotion = useReducedMotion();

  const wasCollapsed = useRef(isCollapsed);
  const shouldAnimate =
    !shouldReduceMotion && wasCollapsed.current && !isCollapsed;

  useEffect(() => {
    wasCollapsed.current = isCollapsed;
  }, [isCollapsed]);

  if (isCollapsed || isDismissed) {
    return null;
  }

  const fieldsHref = `/${params.workspace}/settings/fields`;

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="p-2"
      initial={shouldAnimate ? { opacity: 0, x: "-100%" } : false}
      transition={{ duration: 0.4 }}
    >
      <section className="relative overflow-hidden rounded-[20px] border border-sidebar-border/80 bg-background p-1">
        <Button
          aria-label="Dismiss what’s new card"
          className="absolute top-3 right-3 z-20 size-6 text-foreground"
          onClick={() => setIsDismissed(true)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-3.5" />
        </Button>
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-[18px] border border-sidebar-border/70 bg-sidebar-accent/20">
            <Image
              alt="Schema-style preview of Marble custom fields"
              className="h-auto w-full dark:hidden"
              height={220}
              priority={false}
              src="/custom-fields-card-light.svg"
              width={400}
            />
            <Image
              alt="Schema-style preview of Marble custom fields"
              className="hidden h-auto w-full dark:block"
              height={220}
              priority={false}
              src="/custom-fields-card-dark.svg"
              width={400}
            />
          </div>
          <div className="space-y-2 px-2 pb-3">
            <div className="flex items-center gap-2">
              <Badge className="text-[11px]" variant="positive">
                New
              </Badge>
              <h4 className="font-medium text-[14px] text-foreground leading-none tracking-tight">
                Custom Fields
              </h4>
            </div>
            <p
              className={cn(
                "text-[13px] text-muted-foreground leading-6",
                "overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]"
              )}
            >
              Extend your post metadata by defining custom fields.
            </p>
            <Link
              className="font-medium text-[13px] text-primary underline underline-offset-4 transition-colors hover:text-primary/85"
              href={fieldsHref}
            >
              Configure Fields
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
