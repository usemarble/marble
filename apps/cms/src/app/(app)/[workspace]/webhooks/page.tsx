import { Button } from "@marble/ui/components/button";
import { WebhookIcon } from "lucide-react";

function Page() {
  return (
    <div className="h-full grid place-content-center">
      <div className="flex flex-col gap-4 items-center max-w-80">
        <div className="p-2 border">
          <WebhookIcon className="size-16 stroke-[1px]" />
        </div>
        <div className="text-center flex flex-col gap-4 items-center">
          <p className="text-muted-foreground text-sm">
            Webhooks allow you perform actions on your server when certain
            events occur in your workspace.
          </p>
          <Button size="sm" disabled className="w-fit">
            <span>Create a Webhook</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Page;
