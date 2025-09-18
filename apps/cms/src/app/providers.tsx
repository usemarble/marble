"use client";

import { Databuddy } from "@databuddy/sdk";
import { Toaster } from "@marble/ui/components/sonner";
import { TooltipProvider } from "@marble/ui/components/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";

function DatabuddyProvider() {
  return (
    <>
      {process.env.NODE_ENV !== "development" &&
        process.env.DATEBUDDY_CLIENT_ID && (
          <Databuddy
            clientId={process.env.DATEBUDDY_CLIENT_ID}
            enableBatching={true}
          />
        )}
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 1000 * 60 * 60, // 1 hour
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <DatabuddyProvider />
      <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          {children}
          <Suspense>
            <Toaster position="top-center" />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
    </QueryClientProvider>
  );
}
