"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

export default function MarbleIcon() {
  const { theme } = useTheme();

  return (
    <Image
      src={theme === "dark" ? "/icon-light.svg" : "/icon.svg"}
      alt="Marble Icon"
      width={32}
      height={32}
      className="size-8"
    />
  );
}
