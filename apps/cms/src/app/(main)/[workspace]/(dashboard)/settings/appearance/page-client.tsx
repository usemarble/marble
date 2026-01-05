"use client";

import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { ThemeSwitch } from "@/components/settings/theme";

function PageClient() {
  return (
    <WorkspacePageWrapper className="flex flex-col gap-8 py-12" size="compact">
      <Card className="gap-0 rounded-[20px] border-none bg-sidebar p-2">
        <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="font-medium text-lg">Theme</CardTitle>
            <CardDescription>Choose your preferred theme.</CardDescription>
          </div>
          <div className="flex items-center">
            <ThemeSwitch />
          </div>
        </div>
        <div className="px-2 pt-4 pb-2">
          <p className="text-muted-foreground text-sm">
            This defaults to the system theme.
          </p>
        </div>
      </Card>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
