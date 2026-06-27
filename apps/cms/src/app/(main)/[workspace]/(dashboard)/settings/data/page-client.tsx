"use client";

import { DashboardBody } from "@/components/layout/wrapper";
import { Export } from "@/components/settings/fields/export";
import { Import } from "@/components/settings/fields/import";
import PageLoader from "@/components/shared/page-loader";
import { useWorkspace } from "@/providers/workspace";

function PageClient() {
  const { activeWorkspace, isFetchingWorkspace } = useWorkspace();

  if (isFetchingWorkspace || !activeWorkspace) {
    return <PageLoader />;
  }

  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <Import />
      <Export />
    </DashboardBody>
  );
}

export default PageClient;
