"use client";
import { Button, buttonVariants } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import { ArrowUpRight, Question } from "@phosphor-icons/react";

const externalLinks = [
  {
    label: "Documentation",
    href: "https://docs.marblecms.com",
  },
  {
    label: "Report an issue",
    href: "https://github.com/taqh/marble/issues",
  },
  {
    label: "Contact support",
    href: "mailto:support@marblecms.com",
  },
];

export function NavExtra() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-lg">
          <Question size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" sideOffset={6} className="divide-y p-0">
        <div className="flex flex-col gap-2 p-4">
          <h3 className="">Need help?</h3>
        </div>
        <ul className="flex flex-col py-3 px-2">
          {externalLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    class: "w-full justify-between text-sidebar-foreground",
                  }),
                )}
              >
                {link.label}
                <ArrowUpRight />
              </a>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
