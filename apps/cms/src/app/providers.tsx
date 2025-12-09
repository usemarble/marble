"use client";

import { ToastProvider } from "@marble/ui/components/toast";
import { TooltipProvider } from "@marble/ui/components/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 1000 * 60 * 60, // 1 hour
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" disableTransitionOnChange enableSystem>
        <ToastProvider>
          <TooltipProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </TooltipProvider>
        </ToastProvider>
      </ThemeProvider>
      <ReactQueryDevtools buttonPosition="top-right" initialIsOpen={false} />
    </QueryClientProvider>
  );
}
