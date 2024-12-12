"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { useTheme } from "next-themes";
import Image from "next/image";

const themes = [
  {
    name: "light",
    label: "Light",
    imageSrc: "https://avatar.vercel.sh/placeholder?height=120&width=200",
  },
  {
    name: "dark",
    label: "Dark",
    imageSrc: "https://avatar.vercel.sh/placeholder?height=120&width=200",
  },
  {
    name: "system",
    label: "System",
    imageSrc: "https://avatar.vercel.sh/placeholder?height=120&width=200",
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
                <Image
                  src={item.imageSrc}
                  alt={`${item.label} theme preview`}
                  width={200}
                  height={120}
                  className="object-cover"
                />
                <div className="p-4 text-center font-medium">{item.label}</div>
              </CardContent>
            </Card>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
