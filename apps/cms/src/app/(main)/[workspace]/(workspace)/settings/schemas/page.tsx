"use client";

import { Button } from "@marble/ui/components/button";
import { DatabaseIcon } from "@phosphor-icons/react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";

function Page() {
  return (
    <WorkspacePageWrapper className="h-full grid place-content-center">
      <div className="flex flex-col gap-4 items-center max-w-80">
        <div className="p-2">
          <DatabaseIcon className="size-16" />
        </div>
        <div className="text-center flex flex-col gap-4 items-center">
          <p className="text-muted-foreground text-sm">
            Extend the default post schema with custom fields.
          </p>
          <Button disabled className="w-fit">
            <span>Create a Schema</span>
          </Button>
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default Page;
