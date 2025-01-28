"use client";

import Account from "@/components/settings/account";
import { ColorSwitch } from "@/components/settings/color";
import { CookieSettings } from "@/components/settings/cookies";
import { ThemeSwitch } from "@/components/settings/theme";
import WorkspaceForm from "@/components/settings/workspace-form";
import { deleteWorkspaceAction } from "@/lib/actions/workspace";
import type { ActiveOrganization, Session } from "@/lib/auth/types";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Separator } from "@repo/ui/components/separator";
import { toast } from "@repo/ui/components/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { set } from "date-fns";
import { Check, CopyIcon, Loader } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface PageClientProps {
  activeWorkspace: ActiveOrganization;
  session: Session;
}

function PageClient({ activeWorkspace, session }: PageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "workspace";
  const [copied, setCopied] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  // const switchTab = (tab: string) => {
  //   const newParams = new URLSearchParams(searchParams.toString());
  //   newParams.set("tab", tab);
  //   router.push(`?${newParams.toString()}`);
  // };

  const copyWorkspaceId = () => {
    const id = activeWorkspace.id;
    if (!id) return;
    setCopied(true);
    navigator.clipboard.writeText(id);
    toast.success("ID copied to clipboard.", {
      position: "bottom-center",
    });
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const handleDeleteWorkspace = async () => {
    const id = activeWorkspace.id;
    if (!id) return;
    setIsDeletingWorkspace(true);
    try {
      await deleteWorkspaceAction(activeWorkspace.id);
      toast.success("Workspace deleted.");
      router.push("/");
    } catch (error) {
      toast.error("Failed to delete workspace.");
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  return (
    <div className="w-full max-w-screen-sm mx-auto space-y-8 pt-8 pb-14">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          View and Manage your workspace settings.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <Tabs
          // onValueChange={switchTab}
          defaultValue={currentTab}
          className="w-full"
        >
          <TabsList variant="underline" className="flex justify-start mb-10">
            <TabsTrigger variant="underline" value="workspace">
              Workspace
            </TabsTrigger>
            <TabsTrigger variant="underline" value="account">
              Account
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

              <Card className="hover:border-destructive">
                <CardHeader>
                  <CardTitle className="text-lg">Delete workspace.</CardTitle>
                  <CardDescription>
                    Permanently delete your workspace and all associated data
                    within. This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-end">
                  <Button
                    variant="destructive"
                    disabled={isDeletingWorkspace}
                    onClick={handleDeleteWorkspace}
                    className="min-w-[151px]"
                  >
                    {isDeletingWorkspace ? (
                      <Loader className="size-4 animate-spin" />
                    ) : (
                      "Delete Workspace"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </section>
          </TabsContent>
          {/*  */}
          <TabsContent value="account" className="space-y-14">
            <section className="space-y-10">
              <div>
                <h1 className="text-lg font-semibold">Account</h1>
                <p className="text-muted-foreground text-sm">
                  Update personal information used for account management and
                  billing.
                </p>
              </div>
              <Account />
            </section>
            <Separator />
            <section className="space-y-8">
              <div>
                <h1 className="text-lg font-semibold">Notifications</h1>
                <p className="text-muted-foreground text-sm">
                  Manage your personal notification settings for this workspace.
                  Read the governance documentation to learn more.
                </p>
              </div>
              <ul className="flex flex-col gap-6">
                <li className="flex gap-4">
                  <Checkbox id="newsletter" />{" "}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="newsletter">Receive newsletter</Label>
                    <p className="text-muted-foreground text-sm">
                      I want to receive updates about relevant products or
                      services.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Checkbox id="member" />{" "}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="member">Member activities</Label>
                    <p className="text-muted-foreground text-sm">
                      Stay informed and receive notifications when team members
                      join or leave this workspace.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Checkbox id="publish" />{" "}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="publish">Publishing activities</Label>
                    <p className="text-muted-foreground text-sm">
                      Receive notifications when scheduled articles are
                      published.
                    </p>
                  </div>
                </li>
              </ul>
            </section>
            <Separator />
            <section className="flex gap-4 justify-end w-full">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
              <Button size="sm">Save</Button>
            </section>
          </TabsContent>
          {/*  */}
          <TabsContent value="application" className="space-y-12">
            <div>
              <h1 className="text-lg font-semibold">Application</h1>
              <p className="text-muted-foreground text-sm">
                Configure the way the website looks and feels.
              </p>
            </div>
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
