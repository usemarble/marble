import { SidebarProvider } from "@marble/ui/components/sidebar";
import { UnsavedChangesProvider } from "@/providers/unsaved-changes";

function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <UnsavedChangesProvider>
      <div className="p-2 bg-editor-background">
        <SidebarProvider
          className="overflow-y-hidden min-h-[calc(100vh-1rem)] h-[calc(100vh-1rem)]"
          style={
            {
              "--sidebar-width": "400px",
              "--sidebar-background": "var(--color-editor-sidebar-background)",
            } as React.CSSProperties
          }
        >
          {children}
        </SidebarProvider>
      </div>
    </UnsavedChangesProvider>
  );
}

export default EditorLayout;
