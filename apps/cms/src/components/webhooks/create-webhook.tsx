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
import { toast } from "@marble/ui/hooks/use-toast";
import { BracketsCurlyIcon, PlusIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { AsyncButton } from "@/components/ui/async-button";
import { useDebounce } from "@/hooks/use-debounce";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { VALID_DISCORD_DOMAINS, VALID_SLACK_DOMAINS } from "@/lib/constants";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type PayloadFormat,
  type WebhookEvent,
  type WebhookFormValues,
  webhookEvents,
  webhookSchema,
} from "@/lib/validations/webhook";
import { Discord, Slack } from "../shared/icons";

type CreateWebhookSheetProps = {
  children?: React.ReactNode;
};

function CreateWebhookSheet({ children }: CreateWebhookSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const masterCheckboxId = useId();

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
      format: "json",
    },
  });

  const watchedEvents = watch("events");
  const watchedEndpoint = watch("endpoint");
  const debouncedEndpoint = useDebounce(watchedEndpoint, 500);

  const router = useRouter();

  const isDiscordUrl = useCallback((url: string): boolean => {
    if (!url) {
      return false;
    }
    try {
      const urlObj = new URL(url);
      return VALID_DISCORD_DOMAINS.some((domain) => urlObj.hostname === domain);
    } catch {
      return false;
    }
  }, []);

  const isSlackUrl = useCallback((url: string): boolean => {
    if (!url) {
      return false;
    }
    try {
      const urlObj = new URL(url);
      return VALID_SLACK_DOMAINS.some((domain) => urlObj.hostname === domain);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const endpoint = debouncedEndpoint?.trim();
    let nextFormat: PayloadFormat = "json";
    if (endpoint) {
      if (isDiscordUrl(endpoint)) {
        nextFormat = "discord";
      } else if (isSlackUrl(endpoint)) {
        nextFormat = "slack";
      }
    }
    if (watch("format") !== nextFormat) {
      setValue("format", nextFormat);
    }
  }, [debouncedEndpoint, setValue, watch, isDiscordUrl, isSlackUrl]);

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
        queryClient.invalidateQueries({
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
        currentEvents.filter((id) => id !== eventId)
      );
    }
  };

  const handleMasterCheckboxToggle = (checked: boolean) => {
    if (checked) {
      const allEventIds = webhookEvents.map((event) => event.id);
      setValue("events", allEventIds);
    } else {
      setValue("events", []);
    }
  };

  const getMasterCheckboxState = () => {
    const currentEvents = watchedEvents || [];
    const totalEvents = webhookEvents.length;

    return currentEvents.length === totalEvents;
  };

  const onSubmit = (data: WebhookFormValues) => {
    createWebhook(data);
  };

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger render={children ? (children as React.ReactElement) : <Button />}>
        {children ? undefined : (
          <>
            <PlusIcon className="mr-2 size-4" />
            New Webhook
          </>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="p-6">
          <SheetTitle className="font-medium text-xl">New Webhook</SheetTitle>
          <SheetDescription className="sr-only">
            Set the endpoint and select the events you want to receive
            notifications for.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex h-full flex-col justify-between"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-5 grid flex-1 auto-rows-min gap-6 px-6">
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>

              <Input id="name" placeholder="My Webhook" {...register("name")} />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="endpoint">URL</Label>

              <Input
                id="endpoint"
                placeholder="https://marblecms.com/webhooks/"
                {...register("endpoint")}
              />
              {errors.endpoint && (
                <p className="text-destructive text-sm">
                  {errors.endpoint.message}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="format">Format</Label>
              <Select
                onValueChange={(value) =>
                  setValue("format", value as PayloadFormat)
                }
                value={watch("format")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) => {
                      const labels: Record<string, string> = { json: "JSON", discord: "Discord", slack: "Slack" };
                      return labels[value as string] || "Select a payload format";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <BracketsCurlyIcon
                      className="text-amber-500"
                      weight="bold"
                    />
                    JSON
                  </SelectItem>
                  <SelectItem value="discord">
                    <Discord fill="#5865F2" />
                    Discord
                  </SelectItem>
                  <SelectItem value="slack">
                    <Slack />
                    Slack
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.format && (
                <p className="text-destructive text-sm">
                  {errors.format.message}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <div className="mb-2 flex items-end justify-between">
                <Label>Events</Label>
                <a
                  className="ml-2 flex cursor-pointer items-center text-primary text-xs hover:underline"
                  href="https://docs.marblecms.com/guides/features/webhooks"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>View Schemas</span>
                </a>
              </div>
              <div className="grid gap-1">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={getMasterCheckboxState()}
                    id={masterCheckboxId}
                    onCheckedChange={(checked) =>
                      handleMasterCheckboxToggle(checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      className="cursor-pointer font-medium text-sm"
                      htmlFor={masterCheckboxId}
                    >
                      Select all events
                    </Label>
                  </div>
                </div>
                {webhookEvents.map((event) => (
                  <div className="flex items-center space-x-3" key={event.id}>
                    <Checkbox
                      checked={watchedEvents?.includes(event.id) || false}
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

          <SheetFooter className="p-6">
            <AsyncButton
              className="w-full"
              isLoading={isCreating}
              type="submit"
            >
              Create webhook
            </AsyncButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default CreateWebhookSheet;
