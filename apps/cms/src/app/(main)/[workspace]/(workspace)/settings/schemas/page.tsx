"use client";

import { Button } from "@marble/ui/components/button";
import { Database } from "@phosphor-icons/react";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";

function Page() {
  return (
    <WorkspacePageWrapper className="grid h-full place-content-center">
      <div className="flex max-w-80 flex-col items-center gap-4">
        <div className="border p-2">
          <Database className="size-16 stroke-[1px]" />
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm">
            Extend the default post schema with custom fields.
          </p>
          <Button className="w-fit" disabled size="sm">
            <span>Create a Schema</span>
          </Button>
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default Page;
