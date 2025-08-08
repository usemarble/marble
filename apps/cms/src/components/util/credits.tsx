"use client";

import Link from "next/link";
import { useTheme } from "next-themes";

const credits = {
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
  return (
    <Link
      href={credits[theme as keyof typeof credits ?? "dark"].image}
      target="_blank"
      className="text-sm font-medium text-muted-foreground hover:text-primary underline underline-offset-4"
    >
      Image by {credits[theme as keyof typeof credits ?? "dark"]?.text}
    </Link>
  );
}