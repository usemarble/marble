"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

export default function MarbleIcon() {
	const { theme } = useTheme();

	return (
		<Image
			alt="Marble Icon"
			className="size-8"
			height={32}
			src={theme === "dark" ? "/icon-light.svg" : "/icon.svg"}
			width={32}
		/>
	);
}
