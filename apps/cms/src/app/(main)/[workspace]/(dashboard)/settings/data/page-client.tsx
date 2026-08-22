"use client";

import { DashboardBody } from "@/components/layout/wrapper";
import { Export } from "@/components/settings/fields/export";
import { Import } from "@/components/settings/fields/import";
import { DataSettingsSkeleton } from "@/components/settings/loading-skeletons";
import { useWorkspace } from "@/providers/workspace";

function PageClient() {
  const { activeWorkspace, isFetchingWorkspace } = useWorkspace();

  if (isFetchingWorkspace || !activeWorkspace) {
    return <DataSettingsSkeleton />;
  }

  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <Import />
      <Export />
    </DashboardBody>
  );
}

export default PageClient;
