"use client";

import { Add } from "@/components/icons";
import { useWorkspace } from "@/components/providers/workspace";
import { CreateSiteModal } from "@/components/site/create-site-modal";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Plus } from "@repo/ui/lib/icons";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface WorkspaceData {
  id: string;
  name: string;
  _count: {
    sites: number;
    members: number;
  };
}

interface PageClientProps {
  workspace: WorkspaceData;
}

function PageClient({ workspace }: PageClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-6">{workspace.name} Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-medium">{workspace._count.sites}</p>
            </CardContent>
          </Card>
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
