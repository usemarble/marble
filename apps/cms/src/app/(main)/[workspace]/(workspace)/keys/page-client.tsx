"use client";

import { Button } from "@marble/ui/components/button";
import { Key } from "@phosphor-icons/react";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";

function PageClient() {
  return (
    <WorkspacePageWrapper className="grid h-full place-content-center">
      <div className="flex max-w-80 flex-col items-center gap-4">
        <div className="p-2">
          <Key className="size-16" />
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm">
            API keys let you interact with your workspace using our API.
          </p>
          <Button className="w-fit" disabled size="sm">
            <span>New API Key</span>
          </Button>
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
