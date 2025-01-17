import { ColorSwitch } from "@/components/settings/color";
import { CookieSettings } from "@/components/settings/cookies";
import { ThemeSwitch } from "@/components/settings/theme";
import WorkspaceForm from "@/components/settings/workspace-form";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Separator } from "@repo/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";

async function page() {
  return (
    <div className="w-full max-w-screen-md mx-auto space-y-12 pt-10 pb-14">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal details, workspace governance and notifications.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="workspace" className="w-full">
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
          {/*  */}
          <TabsContent value="workspace">
            <section className="space-y-10">
              <div>
                <h1 className="text-lg font-semibold">Workspace</h1>
                <p className="text-muted-foreground text-sm">
                  Make changes to your account here. Click save when you're
                  done.
                </p>
              </div>
              <WorkspaceForm />
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
              <div className="flex flex-col gap-4">
                <div className="grid gap-6 grid-cols-2">
                  <div>
                    <Label>Firstname</Label>
                    <Input />
                  </div>
                  <div>
                    <Label>Lastname</Label>
                    <Input />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input />
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label>Country</Label>
                    <Input />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input />
                  </div>
                  <div>
                    <Label>Zip / Postal code</Label>
                    <Input />
                  </div>
                </div>
              </div>
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
                      I want to receive updates from Company about relevant
                      products or services.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Checkbox id="member" />{" "}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="member">Member activities</Label>
                    <p className="text-muted-foreground text-sm">
                      Stay informed and receive notifications when new team
                      members join or leave this workspace.
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
              <li className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">Theme</p>
                </div>
                <ThemeSwitch />
              </li>
              <li className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">Cookies</p>
                </div>
                <CookieSettings />
              </li>
              <li className="flex items-center justify-between py-4">
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

export default page;
