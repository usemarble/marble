"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import { Checkbox } from "@marble/ui/components/checkbox";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@marble/ui/components/sheet";
import { toast } from "@marble/ui/components/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { usePlan } from "@/hooks/use-plan";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type WebhookEvent,
  type WebhookFormValues,
  webhookEvents,
  webhookSchema,
} from "@/lib/validations/webhook";
import { ButtonLoader } from "../ui/loader";

interface CreateWebhookSheetProps {
  children?: React.ReactNode;
}

function CreateWebhookSheet({ children }: CreateWebhookSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: "",
      endpoint: "",
      events: [],
      secret: "",
      format: "json",
    },
  });

  const watchedEvents = watch("events");

  const router = useRouter();

  const { mutate: generateSecret, isPending: isGeneratingSecret } = useMutation(
    {
      mutationFn: () =>
        fetch("/api/webhooks/secret", {
          method: "POST",
        }).then((res) => res.json()),
      onSuccess: (data) => {
        if (data.success && data.secret) {
          setValue("secret", data.secret);
          toast.success("Secret generated successfully");
        } else {
          toast.error("Failed to generate secret");
        }
      },
      onError: () => {
        toast.error("Failed to generate secret");
      },
    },
  );

  const { mutate: createWebhook, isPending: isCreating } = useMutation({
    mutationFn: (data: WebhookFormValues) =>
      fetch("/api/webhooks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Webhook created successfully");
      reset();
      setIsOpen(false);
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
        });
      }
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to create webhook");
    },
  });

  const handleEventToggle = (eventId: WebhookEvent, checked: boolean) => {
    const currentEvents = watchedEvents || [];
    if (checked) {
      setValue("events", [...currentEvents, eventId]);
    } else {
      setValue(
        "events",
        currentEvents.filter((id) => id !== eventId),
      );
    }
  };

  const onSubmit = (data: WebhookFormValues) => {
    createWebhook(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button>
            <Plus className="size-4 mr-2" />
            New webhook
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-[500px] h-[calc(100vh-20px)] top-1/2 -translate-y-1/2 right-[10px] rounded-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <SheetHeader className="pb-3">
            <SheetTitle>New webhook</SheetTitle>
            <SheetDescription className="sr-only">
              Configure the endpoint and select the events you want to receive
              notifications for.
            </SheetDescription>
          </SheetHeader>

          <div className="h-[calc(100vh-180px)] pr-4 scrollbar-hide overflow-y-auto">
            <div className="grid gap-6 py-6">
              {/* Name Field */}
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
                <Input
                  id="name"
                  placeholder="My webhook"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* URL Field */}
              <div className="grid gap-2">
                <Label htmlFor="endpoint">URL</Label>
                {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
                <Input
                  id="endpoint"
                  placeholder="https://marblecms.com/webhooks/"
                  {...register("endpoint")}
                />
                {errors.endpoint && (
                  <p className="text-sm text-destructive">
                    {errors.endpoint.message}
                  </p>
                )}
              </div>

              {/* Format Field */}
              <div className="grid gap-2">
                <Label htmlFor="format">Format</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("format", value as "json" | "discord")
                  }
                  defaultValue="json"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payload format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                  </SelectContent>
                </Select>
                {errors.format && (
                  <p className="text-sm text-destructive">
                    {errors.format.message}
                  </p>
                )}
              </div>

              {/* Secret Field */}
              <div className="grid gap-2">
                <Label htmlFor="secret">Secret</Label>
                <div className="flex gap-2">
                  {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
                  <Input
                    id="secret"
                    placeholder="Your webhook secret (optional)"
                    {...register("secret")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generateSecret()}
                    disabled={isGeneratingSecret}
                  >
                    {isGeneratingSecret ? <ButtonLoader /> : "Generate"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  All webhook payloads will be signed with this secret.
                </p>
                {errors.secret && (
                  <p className="text-sm text-destructive">
                    {errors.secret.message}
                  </p>
                )}
              </div>

              {/* Events Field */}
              <div className="grid gap-4">
                <div className="flex items-end">
                  <Label>Events</Label>
                  <a
                    href="https://docs.marblecms.com/webhooks/events"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary cursor-pointer hover:underline ml-2 flex items-center"
                  >
                    <span>View schemas</span>
                    {/* <ArrowUpRight className="size-4" /> */}
                  </a>
                </div>
                <div className="grid gap-3">
                  {webhookEvents.map((event) => (
                    <div key={event.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={event.id}
                        checked={watchedEvents?.includes(event.id) || false}
                        onCheckedChange={(checked) =>
                          handleEventToggle(event.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={event.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {event.label}
                        </Label>
                        {/* <span className="text-sm text-primary cursor-pointer hover:underline ml-2">
                          Schema
                        </span> */}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.events && (
                  <p className="text-sm text-destructive">
                    {errors.events.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="flex-col sm:flex-row gap-2 pt-3 pb-0 mt-auto">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <ButtonLoader /> : "Create webhook"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default CreateWebhookSheet;

interface WebhookButtonProps {
  children?: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function WebhookButton({
  children,
  variant = "default",
  size = "default",
}: WebhookButtonProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isFreePlan } = usePlan();

  const handleWebhookClick = () => {
    if (isFreePlan) {
      setShowUpgradeModal(true);
    }
  };

  if (isFreePlan) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant={variant} size={size} onClick={handleWebhookClick}>
              {children || (
                <>
                  <Plus className="size-4 mr-2" />
                  New webhook
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Upgrade your plan to use webhooks</p>
          </TooltipContent>
        </Tooltip>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </TooltipProvider>
    );
  }

  return (
    <CreateWebhookSheet>
      <Button variant={variant} size={size}>
        {children || (
          <>
            <Plus className="size-4" />
            New webhook
          </>
        )}
      </Button>
    </CreateWebhookSheet>
  );
}
