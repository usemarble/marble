"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@marble/ui/components/tabs";
import { FileCsv } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import WorkspaceWrapper from "@/components/layout/workspace-wrapper";
import WorkspaceForm from "@/components/settings/workspace-form";
import type { ActiveOrganization, Session } from "@/lib/auth/types";

type TabId = "workspace" | "data" | "billing";

const tabInfo = {
  workspace: {
    title: "Workspace Settings",
    description: "View and manage your workspace settings",
  },
  data: {
    title: "Data Settings",
    description: "Export all data from your workspace",
  },
  billing: {
    title: "Billing Settings",
    description: "Update billing and payment information",
  },
} as const;

interface PageClientProps {
  activeWorkspace: ActiveOrganization;
  session: Session;
}

function PageClient({ activeWorkspace, session }: PageClientProps) {
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) || "workspace",
  );
  const router = useRouter();

  const updateTab = (tab: string) => {
    setCurrentTab(tab as TabId);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  return (
    <WorkspaceWrapper className="space-y-8 pt-8 pb-14 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{tabInfo[currentTab].title}</h1>
        <p className="text-muted-foreground text-sm">
          {tabInfo[currentTab].description}
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <Tabs value={currentTab} onValueChange={updateTab} className="w-full">
          <TabsList variant="underline" className="flex justify-start mb-10">
            <TabsTrigger variant="underline" value="workspace">
              Workspace
            </TabsTrigger>
            <TabsTrigger variant="underline" value="data">
              Data
            </TabsTrigger>
          </TabsList>
          <TabsContent value="workspace">
            <WorkspaceForm
              id={activeWorkspace.id}
              name={activeWorkspace.name}
              slug={activeWorkspace.slug}
              logo={activeWorkspace.logo}
            />
          </TabsContent>
          <TabsContent value="data" className="space-y-14">
            <div className="min-h-96 grid place-content-center">
              <div className="flex flex-col gap-2 items-center">
                <FileCsv className="w-10 h-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Coming soon.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </WorkspaceWrapper>
  );
}

export default PageClient;
