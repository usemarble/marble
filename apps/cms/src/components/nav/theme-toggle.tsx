"use client";

import { Button } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {
  return;
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const cycleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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
        return <SunIcon className="size-4" />;
    }
  };

  const getTooltipText = () => {
    if (!mounted) {
      return "Theme";
    }

    switch (theme) {
      case "light":
        return "Light theme";
      case "dark":
        return "Dark theme";
      default:
        return "Light theme";
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        delay={300}
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
