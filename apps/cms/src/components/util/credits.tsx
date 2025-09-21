"use client";

import Link from "next/link";
import { useTheme } from "next-themes";

type ThemeName = "light" | "dark";

const creditsByTheme: Record<ThemeName, { image: string; text: string }> = {
  light: {
    image: "https://unsplash.com/@hngstrm",
    text: "H&CO",
  },
  dark: {
    image: "https://unsplash.com/@lereverdo",
    text: "Valeria Reverdo",
  },
};

export default function Credits() {
  const { theme } = useTheme();

  const themeKey: ThemeName = theme === "light" ? "light" : "dark";
  const { image, text } = creditsByTheme[themeKey];

  return (
    <Link
      className="font-medium text-muted-foreground text-sm underline underline-offset-4 hover:text-primary"
      href={image}
      target="_blank"
    >
      Image by {text}
    </Link>
  );
}
