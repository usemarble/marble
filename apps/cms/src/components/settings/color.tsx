"use client";

import { useLocalStorage } from "@/hooks/use-localstorage";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Check, ChevronDown, Palette } from "lucide-react";

const colors = [
  {
    name: "slate",
    label: "Slate",
    class: "bg-slate-500",
  },
  {
    name: "emerald",
    label: "Emerald",
    class: "bg-emerald-500",
  },
  {
    name: "fuchsia",
    label: "Fuchsia",
    class: "bg-fuchsia-500",
  },
  {
    name: "amber",
    label: "Amber",
    class: "bg-amber-500",
  },
  {
    name: "sky",
    label: "Sky",
    class: "bg-sky-500",
  },
];

export function ColorSwitch() {
  const [selectedColor, setSelectedColor] = useLocalStorage(
    "primary-color",
    "slate",
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="mr-2 size-4 text-muted-foreground" />
          <span>Color</span>
          <ChevronDown className="ml-2 size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {colors.map((color) => (
          <DropdownMenuItem
            key={color.name}
            onClick={() => setSelectedColor(color.name)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className={`size-4 rounded-full ${color.class}`} />
              {color.label}
            </div>
            <Check
              className={`size-4 ${selectedColor === color.name ? "opacity-100" : "opacity-0"}`}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
