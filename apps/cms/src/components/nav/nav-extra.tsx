"use client";
import { Button, buttonVariants } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  BugIcon,
  NewspaperClippingIcon,
  QuestionIcon,
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

export function NavExtra() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-lg">
          <QuestionIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" sideOffset={6} className="w-60 divide-y p-0">
        <div className="p-2">
          <h3 className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Get in touch
          </h3>
          <ul className="flex flex-col">
            {communityLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-start gap-2 text-muted-foreground",
                  )}
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
          <h3 className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Resources
          </h3>
          <ul className="flex flex-col">
            {resourceLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-start gap-2 text-muted-foreground",
                  )}
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
    </Popover>
  );
}
