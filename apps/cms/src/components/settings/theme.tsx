"use client";

import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { CaretDownIcon } from "@phosphor-icons/react";
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
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <span className="capitalize" suppressHydrationWarning>
          {theme}
        </span>
        <CaretDownIcon className="ml-2 size-4 text-muted-foreground" />
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
