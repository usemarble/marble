"use client";

import { Button } from "@marble/ui/components/button";
import { Card, CardContent } from "@marble/ui/components/card";
import { Progress } from "@marble/ui/components/progress";
import { Images, Plugs, Users, WebhooksLogo } from "@phosphor-icons/react";
import { format, isValid, parseISO } from "date-fns";
import { useState } from "react";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { usePlan } from "@/hooks/use-plan";
import { useWorkspace } from "@/providers/workspace";

function BillingSettingsPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { activeWorkspace, isOwner } = useWorkspace();
  const { planLimits, currentMemberCount, currentPlan } = usePlan();

  const subscription = activeWorkspace?.subscription;

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return null;

    let date: Date;
    if (typeof dateValue === "string") {
      date = parseISO(dateValue);
    } else {
      date = dateValue;
    }

    if (!isValid(date)) return null;

    return format(date, "MMM d, yyyy");
  };

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

  const getBillingCycleText = () => {
    if (!subscription?.currentPeriodStart || !subscription?.currentPeriodEnd) {
      return "No billing cycle";
    }

    const startDate = formatDate(subscription.currentPeriodStart);
    const endDate = formatDate(subscription.currentPeriodEnd);

    if (!startDate || !endDate) {
      return "No billing cycle";
    }

    return `Current billing cycle: ${startDate} - ${endDate}`;
  };

  return (
    <>
    <title>Billing - Marble</title>
    <WorkspacePageWrapper>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardContent className="px-6 py-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">
                  {getPlanDisplayName()}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getBillingCycleText()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isOwner && (
                  <>
                    <Button onClick={() => setShowUpgradeModal(true)}>
                      {subscription?.plan ? "Change Plan" : "Upgrade"}
                    </Button>
                    <Button variant="outline">View invoices</Button>
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
                  <Plugs className="text-muted-foreground" size={16} />
                </div>
                <h3 className="font-medium">API Requests</h3>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold">0</div>
                <Progress
                  value={planLimits.maxApiRequests === -1 ? 100 : 0}
                  max={
                    planLimits.maxApiRequests === -1
                      ? 100
                      : planLimits.maxApiRequests
                  }
                />
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
                  <WebhooksLogo className="text-muted-foreground" />
                </div>
                <h3 className="font-medium">Webhook Events</h3>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold">0</div>
                <Progress value={0} max={planLimits.maxWebhookEvents || 1} />
                <p className="text-sm text-muted-foreground">
                  {planLimits.maxWebhookEvents === 0
                    ? "No webhook access"
                    : `${planLimits.maxWebhookEvents.toLocaleString()} remaining of ${planLimits.maxWebhookEvents.toLocaleString()}`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                  <Images className="text-muted-foreground" />
                </div>
                <h3 className="font-medium">Media</h3>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold">10 MB</div>
                <Progress value={10} max={planLimits.maxMediaStorage} />
                <p className="text-sm text-muted-foreground">
                  {formatStorageLimit(planLimits.maxMediaStorage - 10)}{" "}
                  remaining of {formatStorageLimit(planLimits.maxMediaStorage)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="text-muted-foreground" size={16} />
                </div>
                <h3 className="font-medium">Members</h3>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold">{currentMemberCount}</div>
                <Progress
                  value={currentMemberCount}
                  max={planLimits.maxMembers}
                />
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
    </>
  );
}

export default BillingSettingsPage;
