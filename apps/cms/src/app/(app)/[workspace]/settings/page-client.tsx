"use client";

import AccountForm from "@/components/settings/account";
import BillingForm from "@/components/settings/billing";
import Billing from "@/components/settings/billing";
import { ColorSwitch } from "@/components/settings/color";
import { CookieSettings } from "@/components/settings/cookies";
import { DeleteWorkspaceModal } from "@/components/settings/delete-workspace-modal";
import { ThemeSwitch } from "@/components/settings/theme";
import WorkspaceForm from "@/components/settings/workspace-form";
import type { ActiveOrganization, Session } from "@/lib/auth/types";
import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";

import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { Separator } from "@marble/ui/components/separator";
import { toast } from "@marble/ui/components/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@marble/ui/components/tabs";
import { Check, CopyIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type TabId = "workspace" | "account" | "billing" | "application";

const tabInfo = {
  workspace: {
    title: "Workspace Settings",
    description: "View and manage your workspace settings",
  },
  account: {
    title: "Account Settings",
    description: "Update personal information and notification preferences",
  },
  billing: {
    title: "Billing Settings",
    description: "Update billing and payment information",
  },
  application: {
    title: "Application Settings",
    description: "Configure the way the website looks and feels",
  },
} as const;

interface PageClientProps {
  activeWorkspace: ActiveOrganization;
  session: Session;
}

function PageClient({ activeWorkspace, session }: PageClientProps) {
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) || "workspace",
  );
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const updateTab = (tab: string) => {
    // console.log("Old tab was:", currentTab);
    setCurrentTab(tab as TabId);
    // console.log("New tab is:", tab)
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const copyWorkspaceId = () => {
    const id = activeWorkspace.id;
    if (!id) return;
    setCopied(true);
    navigator.clipboard.writeText(id);
    toast.success("ID copied to clipboard.");
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-screen-sm mx-auto space-y-8 pt-8 pb-14">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{tabInfo[currentTab].title}</h1>
        <p className="text-muted-foreground text-sm">
          {tabInfo[currentTab].description}
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <Tabs value={currentTab} onValueChange={updateTab} className="w-full">
          <TabsList variant="underline" className="flex justify-start mb-10">
            <TabsTrigger variant="underline" value="workspace">
              Workspace
            </TabsTrigger>
            <TabsTrigger variant="underline" value="account">
              Account
            </TabsTrigger>
            <TabsTrigger variant="underline" value="billing">
              Billing
            </TabsTrigger>
            <TabsTrigger variant="underline" value="application">
              Application
            </TabsTrigger>
          </TabsList>
          <TabsContent value="workspace">
            <section className="space-y-10">
              <WorkspaceForm
                id={activeWorkspace.id}
                name={activeWorkspace.name}
                slug={activeWorkspace.slug}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workspace ID.</CardTitle>
                  <CardDescription>
                    Use this ID to query your posts from the API.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <Label htmlFor="link" className="sr-only">
                        Link
                      </Label>
                      <Input
                        id="link"
                        defaultValue={activeWorkspace?.id}
                        readOnly
                      />
                    </div>
                    <Button
                      variant="outline"
                      type="submit"
                      size="icon"
                      onClick={copyWorkspaceId}
                      className="px-3"
                    >
                      <span className="sr-only">Copy</span>
                      {copied ? (
                        <Check className="size-4" />
                      ) : (
                        <CopyIcon className="size-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delete workspace.</CardTitle>
                  <CardDescription>
                    Permanently delete your workspace and all associated data
                    within. This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-end">
                  <DeleteWorkspaceModal id={activeWorkspace.id} />
                </CardFooter>
              </Card>
            </section>
          </TabsContent>
          {/*  */}
          <TabsContent value="account" className="space-y-14">
            <AccountForm
              email={session.user.email}
              name={session.user.name}
              id={session.user.id}
            />
          </TabsContent>
          <TabsContent value="billing" className="space-y-14">
            <BillingForm
              email={session.user.email}
              name={session.user.name}
              id={session.user.id}
            />
          </TabsContent>
          {/*  */}
          <TabsContent value="application" className="space-y-12">
            <ul className="flex flex-col divide-y border-y">
              <li className="flex items-center justify-between py-6">
                <div>
                  <p className="font-medium">Theme</p>
                </div>
                <ThemeSwitch />
              </li>
              <li className="flex items-center justify-between py-6">
                <div>
                  <p className="font-medium">Cookies</p>
                </div>
                <CookieSettings />
              </li>
              <li className="flex items-center justify-between py-6">
                <div>
                  <p className="font-medium">Primary color</p>
                </div>
                <ColorSwitch />
              </li>
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default PageClient;
