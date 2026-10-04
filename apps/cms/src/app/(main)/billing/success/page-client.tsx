"use client";

import { Button, buttonVariants } from "@marble/ui/components/button";
import { cn } from "@marble/ui/lib/utils";
import { ORPCError } from "@orpc/client";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import MarbleIcon from "@/components/icons/marble";
import { useSession } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";
import { workspacePath } from "@/utils/workspace/url";
import Loading from "./loading";

function celebrate() {
  const duration = 3000;
  const end = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }
    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);

  return () => clearInterval(interval);
}

/**
 * Where Polar sends the browser after checkout. Reaching it isn't proof of
 * payment: Polar's webhook records the subscription. This clears the cached
 * plan and usage so the dashboard picks the new plan up as soon as the webhook
 * lands, then thanks the user.
 */
export default function PageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = useSession();
  const workspaceId = session?.session.activeOrganizationId ?? null;
  const startedFor = useRef<string | null>(null);
  const { mutate, data, isError } = useMutation({
    ...orpc.workspaces.billing.completeCheckout.mutationOptions(),
    onSuccess: async (_result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orpc.workspaces.list.key() }),
        queryClient.invalidateQueries({
          queryKey: orpc.workspaces.metrics.usage.key({ input }),
        }),
      ]);
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

  useEffect(() => {
    if (data) {
      return celebrate();
    }
  }, [data]);

  if (isError && workspaceId) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p>Your payment went through, but we couldn't refresh billing.</p>
        <Button onClick={() => mutate({ workspaceId })}>Try again</Button>
      </main>
    );
  }

  if (!data) {
    return <Loading />;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <MarbleIcon />
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircleIcon
            className="size-8 text-green-600"
            weight="fill"
          />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl">Thanks for subscribing</h1>
          <p className="text-muted-foreground">
            {data.name} is all set. Your new plan is active as soon as the
            payment is confirmed, which usually takes a few seconds.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Link
            className={cn(buttonVariants(), "flex-1")}
            href={workspacePath(data.slug)}
          >
            Go to dashboard
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
            href={workspacePath(data.slug, "settings/billing")}
          >
            View billing
          </Link>
        </div>
      </div>
    </main>
  );
}
