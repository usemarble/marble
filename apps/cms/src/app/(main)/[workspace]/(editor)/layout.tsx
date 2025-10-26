import { SidebarProvider } from "@marble/ui/components/sidebar";
import { UnsavedChangesProvider } from "@/providers/unsaved-changes";

function EditorLayout({ children }: { children: React.ReactNode }) {
	return (
		<UnsavedChangesProvider>
			<div className="bg-editor-background p-2">
				<SidebarProvider
					className="h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-y-hidden"
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
