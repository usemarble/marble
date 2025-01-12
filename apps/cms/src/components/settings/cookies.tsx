"use client";

import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { ChevronDown, Cookie } from "lucide-react";
import { useState } from "react";

const cookieOptions = [
  {
    id: "essential",
    label: "Essential Cookies",
    description: "Required for basic site functionality",
    required: true,
  },
  {
    id: "functional",
    label: "Functional Cookies",
    description: "For enhanced features",
    required: false,
  },
  {
    id: "analytics",
    label: "Analytics Cookies",
    description: "Help us improve our website",
    required: false,
  },
];

export function CookieSettings() {
  const [preferences, setPreferences] = useState<string[]>(["essential"]);

  const toggleCookie = (cookieId: string) => {
    if (cookieId === "essential") return; // Essential cookies can't be disabled
    setPreferences((prev) =>
      prev.includes(cookieId)
        ? prev.filter((id) => id !== cookieId)
        : [...prev, cookieId],
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Cookie className="mr-2 size-4 text-muted-foreground" />
          <span>Cookies</span>
          <ChevronDown className="ml-2 size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Cookie Preferences</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cookieOptions.map((cookie) => (
          <DropdownMenuItem
            key={cookie.id}
            className="cursor-pointer flex items-center justify-between"
            disabled={cookie.required}
            onClick={() => toggleCookie(cookie.id)}
          >
            <div className="flex flex-col">
              <span>{cookie.label}</span>
              <span className="text-xs text-muted-foreground">
                {cookie.description}
              </span>
            </div>
            {preferences.includes(cookie.id) && (
              <span className="text-xs text-primary">Enabled</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
