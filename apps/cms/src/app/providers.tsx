import { WorkspaceProvider } from "@/components/providers/workspace";
import { Toaster } from "@repo/ui/components/sonner";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </WorkspaceProvider>
  );
}
