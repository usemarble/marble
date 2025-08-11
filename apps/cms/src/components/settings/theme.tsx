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
        <Button variant="outline" size="sm">
          <span className="capitalize">{theme}</span>
          <CaretDown className="ml-2 size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((item) => (
          <DropdownMenuItem
            key={item.name.toLowerCase()}
            onClick={() => setTheme(item.name.toLowerCase())}
            className="cursor-pointer"
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
