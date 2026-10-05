"use client";

import { DashboardBody } from "@/components/layout/wrapper";
import { Export } from "@/components/settings/fields/export";
import { Import } from "@/components/settings/fields/import";
import { useWorkspace } from "@/providers/workspace";
import Loading from "./loading";

function PageClient() {
  const { activeWorkspace } = useWorkspace();

  if (!activeWorkspace) {
    return <Loading />;
  }

  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <Import />
      <Export />
    </DashboardBody>
  );
}

export default PageClient;
