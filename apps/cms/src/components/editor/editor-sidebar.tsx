"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@marble/ui/components/sidebar";
import { toast } from "@marble/ui/components/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@marble/ui/components/tabs";
import { cn } from "@marble/ui/lib/utils";
import { SpinnerIcon } from "@phosphor-icons/react";
import type { EditorInstance } from "novel";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { lazy, Suspense } from "react";
import type { Control, FieldErrors, UseFormWatch } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";
import { AsyncButton } from "../ui/async-button";

const MetadataTab = lazy(() =>
  import("./tabs/metadata-tab").then((m) => ({ default: m.MetadataTab }))
);
const AnalysisTab = lazy(() =>
  import("./tabs/analysis-tab").then((m) => ({ default: m.AnalysisTab }))
);

const tabs = {
  metadata: "Metadata",
  analysis: "Analysis",
};

const TabLoadingSpinner = () => (
  <div className="flex h-full items-center justify-center px-6">
    <SpinnerIcon className="size-5 animate-spin" />
  </div>
);

type EditorSidebarProps = React.ComponentProps<typeof Sidebar> & {
  control: Control<PostValues>;
  errors: FieldErrors<PostValues>;
  watch: UseFormWatch<PostValues>;
  formRef: React.RefObject<HTMLFormElement | null>;
  isSubmitting: boolean;
  defaultCoverImage?: string | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mode?: "create" | "update";
  editor?: EditorInstance | null;
};

export function EditorSidebar({
  control,
  errors,
  formRef,
  isSubmitting,
  watch,
  isOpen,
  setIsOpen,
  mode = "create",
  editor,
  ...props
}: EditorSidebarProps) {
  const { open } = useSidebar();
  const hasErrors = Object.keys(errors).length > 0;
  const { tags, authors: initialAuthors } = watch();
  const { hasUnsavedChanges } = useUnsavedChanges();
  const [activeTab, setActiveTab] = useQueryState(
    "active-tab",
    parseAsStringLiteral(Object.keys(tabs)).withDefault("metadata")
  );

  const triggerSubmit = async () => {
    if (hasErrors) {
      console.log("hasErrors", errors);
      return toast.error("Please fill in all required fields", {
        position: "top-right",
      });
    }
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <div>
      <Sidebar
        className={cn(
          "m-2 h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border bg-editor-sidebar-background",
          open ? "" : "mr-0"
        )}
        side="right"
        {...props}
      >
        <SidebarHeader className="sticky top-0 z-10 shrink-0 bg-transparent px-6 py-4">
          <Tabs
            className="w-full"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList
              className={`grid grid-cols-${Object.keys(tabs).length}`}
              variant="line"
            >
              {Object.entries(tabs).map(([value, label]) => (
                <TabsTrigger className="px-2" key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </SidebarHeader>

        <SidebarContent className="min-h-0 flex-1 overflow-hidden bg-transparent">
          <Tabs
            className="flex h-full flex-col"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsContent
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
              value="metadata"
            >
              <Suspense fallback={<TabLoadingSpinner />}>
                <MetadataTab
                  control={control}
                  errors={errors}
                  initialAuthors={initialAuthors}
                  tags={tags}
                />
              </Suspense>
            </TabsContent>

            <TabsContent
              className="min-h-0 flex-1 data-[state=inactive]:hidden"
              value="analysis"
            >
              <Suspense fallback={<TabLoadingSpinner />}>
                <AnalysisTab editor={editor} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </SidebarContent>

        <SidebarFooter className="shrink-0 bg-transparent px-6 py-6">
          {activeTab === "metadata" &&
            (mode === "create" ? (
              <AsyncButton
                className="w-full"
                disabled={!hasUnsavedChanges}
                isLoading={isSubmitting}
                onClick={triggerSubmit}
                type="button"
              >
                Save
              </AsyncButton>
            ) : (
              <AsyncButton
                className="w-full"
                disabled={!hasUnsavedChanges}
                isLoading={isSubmitting}
                onClick={triggerSubmit}
                type="button"
              >
                Update
              </AsyncButton>
            ))}
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
