"use client";

import { Button } from "@marble/ui/components/button";
import { Card, CardContent } from "@marble/ui/components/card";
import { Progress } from "@marble/ui/components/progress";
import { ImagesIcon, PlugsIcon, UsersIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";

const UpgradeModal = dynamic(() =>
  import("@/components/billing/upgrade-modal").then((mod) => mod.UpgradeModal)
);

import { toast } from "sonner";
import { usePlan } from "@/hooks/use-plan";
import { authClient } from "@/lib/auth/client";
import { useWorkspace } from "@/providers/workspace";
import { formatBytes } from "@/utils/string";

function PageClient() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { activeWorkspace, isOwner } = useWorkspace();
  const { planLimits, currentMemberCount, currentPlan, currentMediaUsage } =
    usePlan();

  const subscription = activeWorkspace?.subscription;

  const formatDate = useCallback(
    async (dateValue: string | Date | null | undefined) => {
      if (!dateValue) return null;

      // Dynamically import date-fns only when formatting is needed
      const { format, isValid, parseISO } = await import("date-fns");

      let date: Date;
      if (typeof dateValue === "string") {
        date = parseISO(dateValue);
      } else {
        date = dateValue;
      }

      if (!isValid(date)) return null;

      return format(date, "MMM d, yyyy");
    },
    []
  );

  const getPlanDisplayName = () => {
    switch (currentPlan) {
      case "pro":
        return "Pro Plan";
      case "team":
        return "Team Plan";
      default:
        return "Free Plan";
    }
  };

  const formatApiRequestLimit = (limit: number) => {
    if (limit === -1) return "Unlimited";
    return limit.toLocaleString();
  };

  const formatStorageLimit = (limitMB: number) => {
    if (limitMB >= 1024) {
      return `${(limitMB / 1024).toFixed(0)} GB`;
    }
    return `${limitMB} MB`;
  };

  const [billingCycleText, setBillingCycleText] = useState<string>(
    "Loading billing cycle..."
  );

  const updateBillingCycleText = useCallback(async () => {
    if (!subscription?.currentPeriodStart || !subscription?.currentPeriodEnd) {
      setBillingCycleText("No billing cycle");
      return;
    }

    const startDate = await formatDate(subscription.currentPeriodStart);
    const endDate = await formatDate(subscription.currentPeriodEnd);

    if (!startDate || !endDate) {
      setBillingCycleText("No billing cycle");
      return;
    }

    setBillingCycleText(`Current billing cycle: ${startDate} - ${endDate}`);
  }, [
    subscription?.currentPeriodStart,
    subscription?.currentPeriodEnd,
    formatDate,
  ]);

  // Update billing cycle text when subscription changes
  useEffect(() => {
    updateBillingCycleText();
  }, [updateBillingCycleText]);

  const maxMediaBytes = planLimits.maxMediaStorage * 1024 * 1024;
  const mediaUsedBytes = currentMediaUsage;
  const mediaRemainingMB = Math.max(
    0,
    Math.ceil(Math.max(0, maxMediaBytes - mediaUsedBytes) / (1024 * 1024))
  );
  const mediaPercent = maxMediaBytes
    ? Math.min(100, Math.round((mediaUsedBytes / maxMediaBytes) * 100))
    : 0;

  const memberMax = planLimits.maxMembers;
  const memberPercent = memberMax
    ? Math.min(100, Math.round((currentMemberCount / memberMax) * 100))
    : 0;

  const redirectCustomerPortal = async () => {
    try {
      await authClient.customer.portal();
    } catch (_e) {
      toast.error("Failed to redirect to customer portal");
    }
  };

  return (
    <WorkspacePageWrapper>
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="px-6 py-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">
                  {getPlanDisplayName()}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {billingCycleText}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isOwner && (
                  <>
                    <Button onClick={() => setShowUpgradeModal(true)}>
                      {subscription?.plan ? "Change Plan" : "Upgrade"}
                    </Button>
                    {subscription?.plan && (
                      <Button
                        onClick={() => redirectCustomerPortal()}
                        variant="outline"
                      >
                        Manage Subscription
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                  <PlugsIcon className="text-muted-foreground" size={16} />
                </div>
                <h3 className="font-medium">API Requests</h3>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold">0</div>
                <Progress value={planLimits.maxApiRequests === -1 ? 100 : 0} />
                <p className="text-sm text-muted-foreground">
                  {planLimits.maxApiRequests === -1
                    ? "Unlimited requests"
                    : `${formatApiRequestLimit(planLimits.maxApiRequests)} remaining of ${formatApiRequestLimit(planLimits.maxApiRequests)}`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                  <ImagesIcon className="text-muted-foreground" />
                </div>
                <h3 className="font-medium">Media</h3>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold">
                  {formatBytes(currentMediaUsage)}
                </div>
                <Progress value={mediaPercent} />
                <p className="text-sm text-muted-foreground">
                  {formatStorageLimit(mediaRemainingMB)} remaining of{" "}
                  {formatStorageLimit(planLimits.maxMediaStorage)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                  <UsersIcon className="text-muted-foreground" size={16} />
                </div>
                <h3 className="font-medium">Members</h3>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold">{currentMemberCount}</div>
                <Progress value={memberPercent} />
                <p className="text-sm text-muted-foreground">
                  {Math.max(0, planLimits.maxMembers - currentMemberCount)}{" "}
                  remaining of {planLimits.maxMembers}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
