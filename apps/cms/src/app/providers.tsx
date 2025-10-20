"use client";

import { Toaster } from "@marble/ui/components/sonner";
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
        <TooltipProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools buttonPosition="top-right" initialIsOpen={false} />
    </QueryClientProvider>
  );
}
