"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";

interface WorkspaceData {
  id: string;
  name: string;
  _count: {
    members: number;
  };
}

interface PageClientProps {
  workspace: WorkspaceData;
}

function PageClient({ workspace }: PageClientProps) {
  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-6">
          {workspace.name} Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-medium">{workspace._count.members}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default PageClient;
