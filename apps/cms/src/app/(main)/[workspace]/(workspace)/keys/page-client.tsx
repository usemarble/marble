"use client";

import { Button } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { KeyIcon } from "@phosphor-icons/react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";

function PageClient() {
  return (
    <WorkspacePageWrapper className="grid h-full place-content-center">
      <div className="flex max-w-80 flex-col items-center gap-4">
        <div className="p-2">
          <KeyIcon className="size-16" />
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm">
            API keys let you interact with your workspace using our API.
          </p>
          <Tooltip>
            <TooltipTrigger>
              <Button disabled className="w-fit">
                <span>New API Key</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Feature Coming Soon</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
