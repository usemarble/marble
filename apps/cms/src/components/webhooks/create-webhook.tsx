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
      format: "JSON",
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
    }
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WEBHOOKS] });
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
        currentEvents.filter((id) => id !== eventId)
      );
    }
  };

  const onSubmit = (data: WebhookFormValues) => {
    createWebhook(data);
  };

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 size-4" />
            New webhook
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="-translate-y-1/2 top-1/2 right-[10px] h-[calc(100vh-20px)] rounded-xl sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <SheetHeader className="pb-3">
            <SheetTitle>New webhook</SheetTitle>
            <SheetDescription className="sr-only">
              Configure the endpoint and select the events you want to receive
              notifications for.
            </SheetDescription>
          </SheetHeader>

          <div className="scrollbar-hide h-[calc(100vh-180px)] overflow-y-auto pr-4">
            <div className="grid gap-6 py-6">
              {/* Name Field */}
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My webhook"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* URL Field */}
              <div className="grid gap-2">
                <Label htmlFor="endpoint">URL</Label>
                <Input
                  id="endpoint"
                  placeholder="https://..."
                  {...register("endpoint")}
                />
                {errors.endpoint && (
                  <p className="text-destructive text-sm">
                    {errors.endpoint.message}
                  </p>
                )}
              </div>

              {/* Format Field */}
              <div className="grid gap-2">
                <Label htmlFor="format">Format</Label>
                <Select
                  defaultValue="JSON"
                  disabled
                  onValueChange={(value) =>
                    setValue("format", value as "JSON" | "FORM_ENCODED")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payload format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JSON">JSON</SelectItem>
                    <SelectItem value="FORM_ENCODED">Form Encoded</SelectItem>
                  </SelectContent>
                </Select>
                {errors.format && (
                  <p className="text-destructive text-sm">
                    {errors.format.message}
                  </p>
                )}
              </div>

              {/* Secret Field */}
              <div className="grid gap-2">
                <Label htmlFor="secret">Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="secret"
                    placeholder="Your webhook secret (optional)"
                    {...register("secret")}
                    className="flex-1"
                  />
                  <Button
                    disabled={isGeneratingSecret}
                    onClick={() => generateSecret()}
                    type="button"
                    variant="outline"
                  >
                    {isGeneratingSecret ? <ButtonLoader /> : "Generate"}
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm">
                  All webhook payloads will be signed with this secret.
                </p>
                {errors.secret && (
                  <p className="text-destructive text-sm">
                    {errors.secret.message}
                  </p>
                )}
              </div>

              {/* Events Field */}
              <div className="grid gap-4">
                <div className="flex items-end">
                  <Label>Events</Label>
                  <a
                    className="ml-2 flex cursor-pointer items-center text-primary text-xs hover:underline"
                    href="https://docs.marblecms.com/webhooks/events"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>View schemas</span>
                    {/* <ArrowUpRight className="size-4" /> */}
                  </a>
                </div>
                <div className="grid gap-3">
                  {webhookEvents.map((event) => (
                    <div className="flex items-center space-x-3" key={event.id}>
                      <Checkbox
                        checked={watchedEvents?.includes(event.id)}
                        id={event.id}
                        onCheckedChange={(checked) =>
                          handleEventToggle(event.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <Label
                          className="cursor-pointer font-medium text-sm"
                          htmlFor={event.id}
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
                  <p className="text-destructive text-sm">
                    {errors.events.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="mt-auto flex-col gap-2 pt-3 pb-0 sm:flex-row">
            <Button disabled={isCreating} type="submit">
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
            <Button onClick={handleWebhookClick} size={size} variant={variant}>
              {children || (
                <>
                  <Plus className="mr-2 size-4" />
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
      <Button size={size} variant={variant}>
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
