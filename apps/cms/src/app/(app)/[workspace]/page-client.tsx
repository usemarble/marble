"use client";

import type { Session } from "@/lib/auth/types";

interface PageClientProps {
  session: Session;
}

function PageClient({ session }: PageClientProps) {
  // TODO: Get and display workspace metrics
  return (
    <>
      <div className="p-4 flex flex-col flex-1 h-full items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">
          Hello, {session.user.name}
        </h1>
        <p className="text-muted-foreground">
          Workspace metrics are coming soon!
        </p>
      </div>
    </>
  );
}

export default PageClient;
