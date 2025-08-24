import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
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
            "--tw-prose-pre-code": "var(--color-zinc-100)",
            "--tw-prose-pre-bg": "var(--color-zinc-800)",
            "--tw-prose-th-borders": "var(--border)",
            "--tw-prose-td-borders": "var(--border)",
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
