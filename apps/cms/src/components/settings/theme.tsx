"use client";

import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { CaretDown } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

const themes = [
  {
    name: "Light",
    label: "Light",
  },
  {
    name: "Dark",
    label: "Dark",
  },
  {
    name: "System",
    label: "System",
  },
];

export function ThemeSwitch() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <span>{theme}</span>
          <CaretDown className="ml-2 size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((item) => (
          <DropdownMenuItem
            className="cursor-pointer"
            key={item.name.toLowerCase()}
            onClick={() => setTheme(item.name.toLowerCase())}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
