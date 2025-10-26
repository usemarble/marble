import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-geist)", ...defaultTheme.fontFamily.sans],
				serif: ["var(--font-literata)", ...defaultTheme.fontFamily.serif],
			},
			typography: () => ({
				marble: {
					css: {
						"--tw-prose-bold": "var(--foreground)",
						"--tw-prose-counters": "var(--foreground)",
						"--tw-prose-bullets": "var(--muted-foreground)",
						"--tw-prose-quotes": "var(--foreground)",
						"--tw-prose-quote-borders": "var(--border)",
						"--tw-prose-captions": "var(--muted-foreground)",
						"--tw-prose-code": "var(--foreground)",
						"--tw-prose-code-bg": "var(--muted)",
						"--tw-prose-pre-code": "var(--color-zinc-100)",
						"--tw-prose-pre-bg": "var(--color-zinc-800)",
						"--tw-prose-th-borders": "var(--border)",
						"--tw-prose-td-borders": "var(--border)",
						"code:not(pre code)": {
							color: "var(--tw-prose-code)",
							backgroundColor: "var(--tw-prose-code-bg)",
							borderRadius: "0.375rem",
							paddingInline: "0.275rem",
							fontSize: "0.875rem",
							fontWeight: "600",
							display: "inline-block",
						},
					},
				},
				DEFAULT: {
					css: {
						a: {
							"&:hover": {
								color: "var(--accent)",
							},
						},
					},
				},
			}),
		},
	},
} satisfies Config;
