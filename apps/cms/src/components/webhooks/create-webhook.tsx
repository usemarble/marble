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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type WebhookEvent,
  type WebhookFormValues,
  webhookEvents,
  webhookSchema,
} from "@/lib/validations/webhook";

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
      format: "json",
    },
  });

  const watchedEvents = watch("events");

  const router = useRouter();

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
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="p-6">
          <SheetTitle className="text-xl font-medium">New webhook</SheetTitle>
          <SheetDescription className="sr-only">
            Set the endpoint and select the events you want to receive
            notifications for.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="h-full flex flex-col justify-between"
        >
          <div className="grid flex-1 auto-rows-min mb-5 gap-6 px-6">
            {/* Name Field */}
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
              <Input id="name" placeholder="My webhook" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* URL Field */}
            <div className="grid gap-3">
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
            <div className="grid gap-3">
              <Label htmlFor="format">Format</Label>
              <Select
                onValueChange={(value) =>
                  setValue("format", value as "json" | "discord")
                }
                defaultValue="json"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a payload format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  {/* <SelectItem value="discord">Discord</SelectItem> */}
                </SelectContent>
              </Select>
              {errors.format && (
                <p className="text-sm text-destructive">
                  {errors.format.message}
                </p>
              )}
            </div>

            {/* Events Field */}
            <div className="grid gap-3">
              <div className="flex items-end">
                <Label>Events</Label>
                <a
                  href="https://docs.marblecms.com/content/guides/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary cursor-pointer hover:underline ml-2 flex items-center"
                >
                  <span>View schemas</span>
                </a>
              </div>
              <div className="grid gap-1">
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

          <SheetFooter className="p-6">
            <AsyncButton
              type="submit"
              isLoading={isCreating}
              className="w-full"
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
