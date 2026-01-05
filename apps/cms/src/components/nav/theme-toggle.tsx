"use client";

import { Button } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const themes = ["light", "dark", "system"] as const;
type Theme = (typeof themes)[number];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme as Theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex] || "system";
    setTheme(nextTheme);
  };

  const getIcon = () => {
    if (!mounted) {
      return <SunIcon className="size-4" />;
    }

    switch (theme) {
      case "light":
        return <SunIcon className="size-4" />;
      case "dark":
        return <MoonIcon className="size-4" />;
      default:
        return <DesktopIcon className="size-4" />;
    }
  };

  const getTooltipText = () => {
    if (!mounted) {
      return "Theme";
    }

    switch (theme) {
      case "light":
        return "Light mode";
      case "dark":
        return "Dark mode";
      default:
        return "System theme";
    }
  };

  return (
    <Tooltip delay={300}>
      <TooltipTrigger
        render={
          <Button
            aria-label="Toggle theme"
            className="rounded-lg"
            onClick={cycleTheme}
            size="icon"
            type="button"
            variant="ghost"
          >
            {getIcon()}
          </Button>
        }
      />
      <TooltipContent side="top">
        <p>{getTooltipText()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
