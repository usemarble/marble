"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
import { Label } from "@marble/ui/components/label";
import { Switch } from "@marble/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import { PRICING_PLANS } from "@marble/utils";
import { ArrowUpRightIcon, CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { AsyncButton } from "@/components/ui/async-button";
import { usePlan } from "@/hooks/use-plan";
import { authClient, checkout } from "@/lib/auth/client";
import { useWorkspace } from "@/providers/workspace";

function PageClient() {
  const [checkoutLoading, setCheckoutLoading] = useState<
    "pro" | "pro-yearly" | "hobby" | null
  >(null);
  const [isYearly, setIsYearly] = useState(true);
  const { activeWorkspace, isOwner } = useWorkspace();
  const { currentPlan, isProPlan } = usePlan();

  const hobbyPlan = PRICING_PLANS.find((p) => p.id === "hobby");
  const proPlan = PRICING_PLANS.find((p) => p.id === "pro");

  const getPlanDisplayName = () => {
    return currentPlan === "pro" ? "Pro" : "Hobby";
  };

  const yearlyMonthlyPrice = "$16";
  const monthlyPrice = "$20";

  const handleCheckout = async (plan: "pro" | "pro-yearly" | "hobby") => {
    if (!activeWorkspace?.id) {
      return;
    }

    setCheckoutLoading(plan);

    try {
      await checkout({
        slug: plan,
        referenceId: activeWorkspace.id,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to start checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const redirectCustomerPortal = async () => {
    try {
      await authClient.customer.portal();
    } catch (_e) {
      toast.error("Failed to redirect to customer portal");
    }
  };

  const renderPlanButton = (planId: "hobby" | "pro") => {
    const isCurrentPlan = currentPlan === planId;

    if (isCurrentPlan) {
      return (
        <Button className="w-full" disabled variant="outline">
          Current Plan
        </Button>
      );
    }

    const isUpgrade = planId === "pro" && currentPlan === "hobby";
    const checkoutSlug =
      planId === "pro" ? (isYearly ? "pro-yearly" : "pro") : "hobby";

    return (
      <AsyncButton
        className="w-full"
        isLoading={checkoutLoading === checkoutSlug}
        onClick={() => handleCheckout(checkoutSlug)}
        variant={isUpgrade ? "default" : "outline"}
      >
        {isUpgrade ? "Upgrade to Pro" : "Downgrade"}
      </AsyncButton>
    );
  };

  return (
    <WorkspacePageWrapper className="flex flex-col gap-8 py-12" size="compact">
      {/* Current Plan Header */}
      <Card className="gap-0 rounded-[20px] border-none bg-surface p-1.5">
        <div className="flex items-center justify-between rounded-[12px] bg-background p-6 shadow-xs">
          <div className="flex flex-col gap-1">
            <CardTitle className="font-medium text-lg">Billing Plan</CardTitle>
            <CardDescription>View and manage your billing plan</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2">
              <span className="text-muted-foreground text-sm">
                Current plan:
              </span>
              <span className="font-medium">{getPlanDisplayName()}</span>
            </div>
            {isOwner && isProPlan && (
              <Button
                onClick={() => redirectCustomerPortal()}
                variant="outline"
              >
                Manage Billing
                <ArrowUpRightIcon className="ml-1 size-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-lg">Plans</h2>
            <p className="text-muted-foreground text-sm">
              Upgrade or change your plan. Pro includes a 3 day free trial.
            </p>
          </div>
          {/* Billing Period Toggle */}
          <div className="flex items-center gap-3">
            <Label
              className={isYearly ? "text-muted-foreground" : "font-medium"}
              htmlFor="billing-toggle"
            >
              Monthly
            </Label>
            <Switch
              checked={isYearly}
              id="billing-toggle"
              onCheckedChange={setIsYearly}
            />
            <Label
              className={isYearly ? "font-medium" : "text-muted-foreground"}
              htmlFor="billing-toggle"
            >
              Yearly
            </Label>
            {/* <Badge className="ml-1" variant="positive">
              Save 17%
            </Badge> */}
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {hobbyPlan && (
            <Card className="relative gap-0 rounded-[20px] border-none bg-surface p-1.5">
              <div className="flex h-full flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-xl">{hobbyPlan.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {hobbyPlan.description}
                    </p>
                  </div>
                  {currentPlan === "hobby" && (
                    <Badge variant="secondary">Current Plan</Badge>
                  )}
                </div>

                <div>
                  <span className="font-bold text-3xl">
                    {hobbyPlan.price.monthly}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {isOwner && renderPlanButton("hobby")}

                <ul className="flex flex-col gap-2">
                  {hobbyPlan.features.map((feature) => (
                    <li
                      className="flex items-center gap-2 text-sm"
                      key={feature}
                    >
                      <CheckIcon className="size-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {proPlan && (
            <Card className="relative gap-0 rounded-[20px] border-none bg-surface p-1.5">
              <div className="flex h-full flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-xl">{proPlan.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {proPlan.description}
                    </p>
                  </div>
                  {currentPlan === "pro" ? (
                    <Badge variant="secondary">Current Plan</Badge>
                  ) : isYearly ? (
                    <Badge variant="positive">Save 20%</Badge>
                  ) : null}
                </div>

                <div>
                  <span className="font-bold text-3xl">
                    {isYearly ? yearlyMonthlyPrice : monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {isOwner && renderPlanButton("pro")}

                <ul className="flex flex-col gap-2">
                  {proPlan.features.map((feature) => (
                    <li
                      className="flex items-center gap-2 text-sm"
                      key={feature}
                    >
                      <CheckIcon className="size-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </section>
      </div>

      <Card className="gap-0 rounded-[20px] border-none bg-surface p-1.5">
        <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
          <div className="flex flex-col gap-1">
            <CardTitle className="font-medium text-lg">Invoices</CardTitle>
            <CardDescription>View your billing history</CardDescription>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  className="py-8 text-center text-muted-foreground"
                  colSpan={5}
                >
                  No invoices yet
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
