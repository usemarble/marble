"use client";
import { Button, buttonVariants } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import {
  ArrowUpRight,
  BookOpen,
  Bug,
  DiscordLogo,
  NewspaperClipping,
  Question,
  TwitterLogo,
} from "@phosphor-icons/react";

const communityLinks = [
  {
    label: "Discord",
    href: "https://discord.gg/gU44Pmwqkx",
    icon: <DiscordLogo size={16} />,
  },
  {
    label: "Twitter",
    href: "https://x.com/usemarblecms",
    icon: <TwitterLogo size={16} />,
  },
];

const resourceLinks = [
  {
    label: "Blog",
    href: "https://marblecms.com/blog",
    icon: <NewspaperClipping size={16} />,
  },
  {
    label: "Documentation",
    href: "https://docs.marblecms.com",
    icon: <BookOpen size={16} />,
  },
  {
    label: "Report an issue",
    href: "https://github.com/usemarble/marble/issues",
    icon: <Bug size={16} />,
  },
];

export function NavExtra() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="rounded-lg" size="icon" variant="ghost">
          <Question size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 divide-y p-0" side="right" sideOffset={6}>
        <div className="p-2">
          <h3 className="px-2 py-1.5 font-semibold text-muted-foreground text-sm">
            Get in touch
          </h3>
          <ul className="flex flex-col">
            {communityLinks.map((link) => (
              <li key={link.label}>
                <a
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      class:
                        "w-full justify-start gap-2 text-sidebar-foreground",
                    })
                  )}
                  href={link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {link.icon}
                  {link.label}
                  <ArrowUpRight className="ml-auto" size={14} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-2">
          <h3 className="px-2 py-1.5 font-semibold text-muted-foreground text-sm">
            Resources
          </h3>
          <ul className="flex flex-col">
            {resourceLinks.map((link) => (
              <li key={link.label}>
                <a
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      class:
                        "w-full justify-start gap-2 text-sidebar-foreground",
                    })
                  )}
                  href={link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {link.icon}
                  {link.label}
                  <ArrowUpRight className="ml-auto" size={14} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
