"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { useId } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspace } from "@/providers/workspace";

export function Id() {
  const { activeWorkspace } = useWorkspace();
  const linkId = useId();

  return (
    <Card className="pt-2">
      <CardHeader className="px-6">
        <CardTitle className="text-lg font-medium">Workspace ID.</CardTitle>
        <CardDescription>
          Unique identifier of your workspace on marble.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor={linkId} className="sr-only">
              Link
            </Label>
            <Input id={linkId} value={activeWorkspace?.id || ""} readOnly />
          </div>
          <CopyButton
            textToCopy={activeWorkspace?.id || ""}
            toastMessage="ID copied to clipboard."
          />
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-6">
        <p className="text-sm text-muted-foreground">
          Please dont share this with anyone as it can be used to access your
          data
        </p>
      </CardFooter>
    </Card>
  );
}
