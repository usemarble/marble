"use client";

import { Button } from "@marble/ui/components/button";
import { Key } from "@phosphor-icons/react";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";

function KeysPage() {
  return (
    <>
    <title>API Keys - Marble</title>
    <WorkspacePageWrapper className="h-full grid place-content-center">
      <div className="flex flex-col gap-4 items-center max-w-80">
        <div className="p-2">
          <Key className="size-16" />
        </div>
        <div className="text-center flex flex-col gap-4 items-center">
          <p className="text-muted-foreground text-sm">
            API keys let you interact with your workspace using our API.
          </p>
          <Button size="sm" disabled className="w-fit">
            <span>New API Key</span>
          </Button>
          </div>
        </div>
      </WorkspacePageWrapper>
    </>
  );
}

export default KeysPage;
