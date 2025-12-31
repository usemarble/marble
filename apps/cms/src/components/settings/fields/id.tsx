"use client";

import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { useId } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspace } from "@/providers/workspace";

export function Id() {
  const { activeWorkspace } = useWorkspace();
  const linkId = useId();

  return (
    <Card className="rounded-[20px] border-none bg-sidebar p-2">
      <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="font-medium text-lg">Workspace ID.</CardTitle>
          <CardDescription>
            Unique identifier of your workspace on marble.
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label className="sr-only" htmlFor={linkId}>
              Link
            </Label>
            <Input id={linkId} readOnly value={activeWorkspace?.id || ""} />
          </div>
          <CopyButton
            textToCopy={activeWorkspace?.id || ""}
            toastMessage="ID copied to clipboard."
          />
        </div>
      </div>
    </Card>
  );
}
