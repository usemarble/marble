"use client";
import { HelpCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { SidebarMenuButton } from "@marble/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  BugIcon,
  NewspaperClippingIcon,
} from "@phosphor-icons/react";
import { Discord, XFormerlyTwitter } from "../icons/social";

const communityLinks = [
  {
    label: "Discord",
    href: "https://discord.gg/gU44Pmwqkx",
    icon: <Discord className="size-4" />,
  },
  {
    label: "Twitter",
    href: "https://x.com/usemarblecms",
    icon: <XFormerlyTwitter className="size-4" />,
  },
];

const resourceLinks = [
  {
    label: "Blog",
    href: "https://marblecms.com/blog",
    icon: <NewspaperClippingIcon className="size-4" />,
  },
  {
    label: "Documentation",
    href: "https://docs.marblecms.com",
    icon: <BookOpenIcon className="size-4" />,
  },
  {
    label: "Report an issue",
    href: "https://github.com/usemarble/marble/issues",
    icon: <BugIcon className="size-4" />,
  },
];

interface NavExtraProps {
  asMenuButton?: boolean;
}

export function NavExtra({ asMenuButton = false }: NavExtraProps) {
  const PopoverContentElement = (
    <PopoverContent className="w-52 divide-y p-0" side={asMenuButton ? "left" : "right"} sideOffset={6}>
      <div className="p-2">
        <h3 className="px-2 py-1.5 font-medium text-foreground/90 text-sm">
          Get in touch
        </h3>
        <ul className="flex flex-col">
          {communityLinks.map((link) => (
            <li key={link.label}>
              <a
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full justify-start gap-2 text-muted-foreground"
                )}
                href={link.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.icon}
                {link.label}
                <ArrowUpRightIcon className="ml-auto size-4" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-2">
        <h3 className="px-2 py-1.5 font-medium text-foreground/90 text-sm">
          Resources
        </h3>
        <ul className="flex flex-col">
          {resourceLinks.map((link) => (
            <li key={link.label}>
              <a
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full justify-start gap-2 text-muted-foreground"
                )}
                href={link.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.icon}
                {link.label}
                <ArrowUpRightIcon className="ml-auto size-4" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </PopoverContent>
  );

  if (asMenuButton) {
    return (
      <Popover>
        <PopoverTrigger
          render={
            <SidebarMenuButton className="border border-transparent transition-colors duration-200 hover:bg-sidebar-accent hover:text-accent-foreground">
              <HugeiconsIcon icon={HelpCircleIcon} />
              <span>Help</span>
            </SidebarMenuButton>
          }
        />
        {PopoverContentElement}
      </Popover>
    );
  }

  return (
    <Popover>
      <Tooltip delay={300}>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  aria-label="Get in touch"
                  className="rounded-lg"
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <HugeiconsIcon icon={HelpCircleIcon} />
                </Button>
              }
            />
          }
        />
        <TooltipContent>
          <p>Help</p>
        </TooltipContent>
      </Tooltip>
      {PopoverContentElement}
    </Popover>
  );
}
