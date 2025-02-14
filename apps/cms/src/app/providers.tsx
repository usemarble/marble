"use client";

import { WorkspaceProvider } from "@/components/context/workspace";
import { Toaster } from "@marble/ui/components/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}
