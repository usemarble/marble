"use client";

import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { Enable } from "@/components/settings/fields/ai/enable";

function PageClient() {
  return (
    <WorkspacePageWrapper className="flex flex-col gap-8 py-12" size="compact">
      <Enable />
    </WorkspacePageWrapper>
  );
}

export default PageClient;
