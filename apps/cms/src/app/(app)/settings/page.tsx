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
    <div className="w-full max-w-screen-lg mx-auto space-y-6">
      <section>
        <div>
          <h1 className="text-3xl font-medium">Settings</h1>
          <p className="text-muted-foreground">
            View and manage your site settings.
          </p>
        </div>
      </section>
      <section>
        <Card>
          <CardHeader>
            <CardTitle>App settings</CardTitle>
            <CardDescription>
              Configure how your app behaves and looks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <ThemeSwitch />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default page;
