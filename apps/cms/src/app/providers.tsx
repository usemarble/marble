"use client";

import { FlagsProvider as DatabuddyFlagsProvider } from "@databuddy/sdk/react";
import { Toaster } from "@marble/ui/components/sonner";
import { TooltipProvider } from "@marble/ui/components/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useSession } from "@/lib/auth/client";

export default function Providers({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();

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
      <ThemeProvider attribute="class" disableTransitionOnChange enableSystem>
        <TooltipProvider>
          {process.env.NEXT_PUBLIC_DATEBUDDY_CLIENT_ID && (
            <DatabuddyFlagsProvider
              apiUrl="https://api.databuddy.cc"
              clientId={process.env.NEXT_PUBLIC_DATEBUDDY_CLIENT_ID}
              debug={false}
              isPending={isPending}
              user={
                data?.user
                  ? {
                      userId: data.user.id,
                      email: data.user.email,
                      properties: {
                        workspace: data.session.activeOrganizationId,
                      },
                    }
                  : undefined
              }
            >
              <NuqsAdapter>{children}</NuqsAdapter>
            </DatabuddyFlagsProvider>
          )}
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools buttonPosition="top-right" initialIsOpen={false} />
    </QueryClientProvider>
  );
}
