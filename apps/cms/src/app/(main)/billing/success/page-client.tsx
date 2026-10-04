"use client";

import { Button } from "@marble/ui/components/button";
import { ORPCError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";
import { workspacePath } from "@/utils/workspace/url";
import Loading from "./loading";

export default function PageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = useSession();
  const workspaceId = session?.session.activeOrganizationId ?? null;
  const startedFor = useRef<string | null>(null);
  const { mutate, isError } = useMutation({
    ...orpc.workspaces.billing.completeCheckout.mutationOptions(),
    onSuccess: async ({ slug }, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orpc.workspaces.list.key() }),
        queryClient.invalidateQueries({
          queryKey: orpc.workspaces.metrics.usage.key({ input }),
        }),
      ]);
      router.replace(`${workspacePath(slug, "settings/billing")}?success=true`);
    },
    onError: (error) => {
      if (
        error instanceof ORPCError &&
        [401, 403, 404].includes(error.status)
      ) {
        router.replace("/");
      }
    },
  });

  useEffect(() => {
    if (sessionPending) {
      return;
    }
    if (!workspaceId) {
      router.replace("/");
      return;
    }
    if (startedFor.current === workspaceId) {
      return;
    }
    startedFor.current = workspaceId;
    mutate({ workspaceId });
  }, [mutate, router, sessionPending, workspaceId]);

  if (isError && workspaceId) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <p>Unable to refresh billing right now.</p>
        <Button onClick={() => mutate({ workspaceId })}>Retry</Button>
      </main>
    );
  }
  return <Loading />;
}
