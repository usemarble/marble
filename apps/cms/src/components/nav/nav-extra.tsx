"use client";
import { buttonVariants } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { Question } from "@phosphor-icons/react";
import Link from "next/link";

export function NavExtra() {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href="https://docs.marblecms.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
                class: "rounded-lg",
              }),
            )}
          >
            <Question size={24} />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Documentation</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
