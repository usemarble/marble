"use client";

import { WarningIcon } from "@phosphor-icons/react";
import Link from "next/link";

interface PlanLimitBannerProps {
  title: string;
  description: string;
  /** Workspace slug, for the billing link. Omit to render without an action. */
  workspaceSlug?: string;
  /** Only owners can change the plan, so only they are offered the action. */
  canUpgrade?: boolean;
}

/**
 * Informational notice for a workspace sitting outside its plan's limits.
 *
 * Deliberately not a blocking state: limits are enforced on growth, never by
 * taking away what a workspace already has, so this explains the situation
 * rather than demanding action.
 */
export function PlanLimitBanner({
  title,
  description,
  workspaceSlug,
  canUpgrade = false,
}: PlanLimitBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <WarningIcon
          className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-500"
          weight="fill"
        />
        <div className="space-y-1">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      {canUpgrade && workspaceSlug ? (
        // A quiet text link on purpose: every page already has one primary
        // action, and a second one here would compete with it.
        <Link
          className="shrink-0 whitespace-nowrap font-medium text-amber-700 text-sm underline underline-offset-4 transition-colors hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
          href={`/${workspaceSlug}/settings/billing`}
        >
          View plans
        </Link>
      ) : null}
    </div>
  );
}
