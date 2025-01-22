"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Loader } from "lucide-react";
import { useState } from "react";

function DestroyWorkspace() {
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteWorkspace = async () => {
    // Delete workspace
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danger zone.</CardTitle>
        <CardDescription>
          This action cannot be undone. This will permanently delete your
          workspace and all associated data within.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="destructive" onClick={handleDeleteWorkspace}>
          {isDeleting ? (
            <Loader className="size-4 animate-spin transition" />
          ) : (
            "Delete Workspace"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default DestroyWorkspace;
