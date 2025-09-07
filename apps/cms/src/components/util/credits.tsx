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
      href={image}
      target="_blank"
      className="text-sm font-medium text-muted-foreground hover:text-primary underline underline-offset-4"
    >
      Image by {text}
    </Link>
  );
}
