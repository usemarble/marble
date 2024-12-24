import { ThemeSwitch } from "@/components/settings/theme";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

function page() {
  return (
    <div className="w-full max-w-screen-md mx-auto space-y-6">
      <section>
        <div>
          <h1 className="text-lg font-medium">Settings</h1>
          <p className="text-muted-foreground">
            View and manage your site settings.
          </p>
        </div>
      </section>
      <section className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>App theme</CardTitle>
            <CardDescription>Configure how your app looks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <ThemeSwitch />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>App theme</CardTitle>
            <CardDescription>Configure how your app looks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              sdsdsdsd
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default page;
