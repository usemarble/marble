"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { KnowledgeWebsiteModal } from "../knowledge/page-client";

function PageClient() {
  return (
    <WorkspacePageWrapper className="grid h-full place-content-center">
      <div className="flex max-w-80 flex-col items-center gap-4">
        <div className="p-2">
          <MagnifyingGlassIcon className="size-16" />
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm">
            Discover and analyze keywords to optimize your content for better
            search rankings.
          </p>
          <KnowledgeWebsiteModal />
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
