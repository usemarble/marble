"use client";

import { Button } from "@marble/ui/components/button";
import { DatabaseIcon } from "@phosphor-icons/react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";

function Page() {
  return (
    <WorkspacePageWrapper className="grid h-full place-content-center">
      <div className="flex max-w-80 flex-col items-center gap-4">
        <div className="p-2">
          <DatabaseIcon className="size-16" />
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm">
            Extend the default post schema with custom fields.
          </p>
          <Button className="w-fit" disabled>
            <span>Create a Schema</span>
          </Button>
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default Page;
