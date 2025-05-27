import { SidebarProvider } from "@marble/ui/components/sidebar";

function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-2 bg-background">
      <SidebarProvider
        className="overflow-y-hidden min-h-[calc(100vh-1rem)] h-[calc(100vh-1rem)]"
        style={
          {
            "--sidebar-width": "400px",
          } as React.CSSProperties
        }
      >
        {children}
      </SidebarProvider>
    </div>
  );
}

export default EditorLayout;
