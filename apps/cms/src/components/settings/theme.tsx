"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { useTheme } from "next-themes";
import { Dark, Light, System } from "../icons";

const themes = [
  {
    name: "light",
    label: "Light",
    Icon: Light,
  },
  {
    name: "dark",
    label: "Dark",
    Icon: Dark,
  },
  {
    name: "system",
    label: "System",
    Icon: System,
  },
];

export function ThemeSwitch() {
  const { setTheme, theme } = useTheme();

  return (
    <RadioGroup
      defaultValue={theme}
      onValueChange={(value) => setTheme(value)}
      className="grid grid-cols-3 gap-4"
    >
      {themes.map((item) => (
        <div key={item.name}>
          <RadioGroupItem
            value={item.name}
            id={item.name}
            className="peer sr-only"
          />
          <Label htmlFor={item.name} className="block cursor-pointer">
            <Card className="overflow-hidden border-2 transition-all peer-aria-checked:border-primary">
              <CardContent className="p-0">
                <div className="flex justify-center p-4">
                  <item.Icon className="size-40 text-primary" />
                </div>
                <div className="p-4 text-center font-medium">{item.label}</div>
              </CardContent>
            </Card>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
