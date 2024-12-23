import { WorkspaceProvider } from "@/components/providers/workspace";
import { Toaster } from "@repo/ui/components/sonner";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WorkspaceProvider>
        <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </WorkspaceProvider>
    </SessionProvider>
  );
}
