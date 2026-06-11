"use client";

import { ArrowLeft02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@marble/ui/components/badge";
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
import { toast } from "@marble/ui/components/sonner";
import { Switch } from "@marble/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { CaretDownIcon, CaretRightIcon } from "@phosphor-icons/react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { HeaderSidebarTrigger } from "@/components/layout/header-sidebar-trigger";
import { DashboardBody } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DeleteWebhookModal } from "@/components/webhooks/delete-webhook";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  getWebhookDeliveriesApiUrl,
  isWebhookDeliveryStatus,
  isWebhookResponseFilter,
  useWebhookDeliveriesFilters,
} from "@/lib/search-params";
import { type WebhookEvent, webhookEvents } from "@/lib/validations/webhook";
import type {
  Webhook,
  WebhookDelivery,
  WebhookDetailResponse,
} from "@/types/webhook";

const deliveryStatuses = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Sending", value: "sending" },
  { label: "Success", value: "success" },
  { label: "Retrying", value: "retrying" },
  { label: "Failed", value: "failed" },
];

const responseFilters = [
  { label: "All HTTP Responses", value: "all" },
  { label: "2xx", value: "2xx" },
  { label: "3xx", value: "3xx" },
  { label: "4xx", value: "4xx" },
  { label: "5xx", value: "5xx" },
  { label: "No response", value: "no_response" },
];

const formatOptions = [
  { label: "JSON", value: "json" },
  { label: "Discord", value: "discord" },
  { label: "Slack", value: "slack" },
];

interface WebhookDetailPageProps {
  id: string;
  workspace: string;
}

export default function WebhookDetailPage({
  id,
  workspace,
}: WebhookDetailPageProps) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [filters, setFilters] = useWebhookDeliveriesFilters();
  const { page, status, response, event, search } = filters;

  const { data, error, isError, isLoading, isFetching } = useQuery({
    queryKey: ["webhook-detail", workspaceId, id, filters],
    queryFn: async (): Promise<WebhookDetailResponse> => {
      const response = await fetch(
        getWebhookDeliveriesApiUrl(`/api/webhooks/${id}`, filters)
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to fetch webhook");
      }

      return response.json();
    },
    enabled: Boolean(workspaceId),
    placeholderData: keepPreviousData,
  });

  const webhook = data?.webhook;

  const copySecret = async () => {
    if (!webhook?.secret) {
      return;
    }

    try {
      await navigator.clipboard.writeText(webhook.secret);
      toast.success("Copied webhook secret");
    } catch {
      toast.error("Could not copy secret");
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);

    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.error ?? "Failed to send test webhook");
      }

      toast.success("Test webhook queued");
      queryClient.invalidateQueries({
        queryKey: ["webhook-detail", workspaceId, id],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send test webhook"
      );
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading && !data) {
    return <PageLoader />;
  }

  if (isError || !data || !webhook) {
    return (
      <DashboardBody showHeader={false}>
        <div className="grid min-h-[calc(100vh-56px)] place-items-center p-8">
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Could not load webhook."}
          </p>
        </div>
      </DashboardBody>
    );
  }

  return (
    <>
      <DashboardBody
        contextView={
          <WebhookSettingsPanel
            onUpdated={(updatedWebhook) => {
              queryClient.setQueryData<WebhookDetailResponse>(
                ["webhook-detail", workspaceId, id, filters],
                (current) =>
                  current ? { ...current, webhook: updatedWebhook } : current
              );

              if (workspaceId) {
                queryClient.invalidateQueries({
                  queryKey: QUERY_KEYS.WEBHOOKS(workspaceId),
                });
              }
            }}
            webhook={webhook}
          />
        }
        flush
        showHeader={false}
      >
        <div className="flex min-h-0 flex-1 flex-col bg-background">
          <div className="flex h-13 shrink-0 items-center gap-2 border-b border-dashed bg-background px-4">
            <HeaderSidebarTrigger />
            <Tooltip>
              <TooltipTrigger
                delay={400}
                render={
                  <Button
                    aria-label="Back to webhooks"
                    nativeButton={false}
                    render={<Link href={`/${workspace}/settings/webhooks`} />}
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <HugeiconsIcon className="size-4" icon={ArrowLeft02Icon} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Back to webhooks</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <section className="min-h-0 flex-1 overflow-y-auto bg-background p-4 md:p-8">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
              <section className="flex flex-col gap-4">
                <div className="min-w-0">
                  <h1 className="font-medium text-2xl tracking-tight">
                    Webhook
                  </h1>
                  <p className="mt-2 break-all text-muted-foreground text-sm">
                    {webhook.url}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-9 min-w-0 max-w-xs items-center gap-2 rounded-lg border pr-1 pl-3">
                      <p className="min-w-0 truncate font-mono text-muted-foreground text-xs">
                        {webhook.secret}
                      </p>
                      <Button
                        className="h-7 shrink-0 px-2 text-xs"
                        onClick={copySecret}
                        size="sm"
                        variant="ghost"
                      >
                        Copy secret
                      </Button>
                    </div>
                    <Button
                      className="shadow-none"
                      disabled={isSendingTest}
                      onClick={handleSendTest}
                      variant="outline"
                    >
                      {isSendingTest ? "Sending…" : "Send test webhook"}
                    </Button>
                  </div>
                  <Button
                    onClick={() => setIsDeleteOpen(true)}
                    variant="destructive"
                  >
                    Delete webhook
                  </Button>
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="font-medium text-xl">Deliveries</h2>

                <div className="flex flex-wrap items-center gap-2">
                  <FilterSelect
                    items={deliveryStatuses}
                    onValueChange={(nextStatus) => {
                      if (isWebhookDeliveryStatus(nextStatus)) {
                        setFilters({ status: nextStatus, page: 1 });
                      }
                    }}
                    value={status}
                  />
                  <FilterSelect
                    items={responseFilters}
                    onValueChange={(nextResponse) => {
                      if (isWebhookResponseFilter(nextResponse)) {
                        setFilters({ response: nextResponse, page: 1 });
                      }
                    }}
                    value={response}
                  />
                  <FilterSelect
                    items={[
                      { label: "All Event Types", value: "all" },
                      ...webhook.events.map((event) => ({
                        label: event.replaceAll("_", "."),
                        value: event,
                      })),
                    ]}
                    onValueChange={(nextEvent) => {
                      setFilters({ event: nextEvent, page: 1 });
                    }}
                    value={event}
                  />
                  {/* <div className="relative">
                    <MagnifyingGlassIcon
                      className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
                      size={16}
                    />
                    <Input
                      aria-label="Search deliveries"
                      className="h-9 w-full rounded-[12px] px-8 shadow-none sm:w-72"
                      onChange={(event) => {
                        setFilters({ search: event.target.value, page: 1 });
                      }}
                      placeholder="Search Deliveries"
                      value={search}
                    />
                    {search ? (
                      <button
                        className="-translate-y-1/2 absolute top-1/2 right-3"
                        onClick={() => {
                          setFilters({ search: "", page: 1 });
                        }}
                        type="button"
                      >
                        <XIcon className="size-4" />
                        <span className="sr-only">Clear search</span>
                      </button>
                    ) : null}
                  </div> */}
                </div>

                <div
                  aria-busy={isFetching}
                  className={cn(
                    "flex flex-col gap-4 transition-opacity duration-150",
                    isFetching && "pointer-events-none opacity-50"
                  )}
                >
                  <DeliveryTable deliveries={data.deliveries} />

                  <DataTablePagination
                    canNextPage={page < data.pageCount}
                    canPreviousPage={page > 1}
                    itemLabel="delivery"
                    onPageChange={(pageIndex) =>
                      setFilters({ page: pageIndex + 1 })
                    }
                    pageCount={data.pageCount}
                    pageIndex={page - 1}
                    rowCount={data.deliveries.length}
                    selectedCount={0}
                    totalCount={data.totalCount}
                    visibleCount={data.deliveries.length}
                  />
                </div>
              </section>
            </div>
          </section>
        </div>
      </DashboardBody>
      <DeleteWebhookModal
        isOpen={isDeleteOpen}
        onDelete={() => router.push(`/${workspace}/settings/webhooks`)}
        onOpenChange={setIsDeleteOpen}
        webhookId={webhook.id}
        webhookName={webhook.name}
      />
    </>
  );
}

function DeliveryTable({ deliveries }: { deliveries: WebhookDelivery[] }) {
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(
    null
  );

  return (
    <div className="overflow-hidden rounded-[20px] bg-surface p-1 [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-container]]:overflow-y-hidden">
      <Table className="-mb-1 h-fit min-w-[820px] border-separate border-spacing-y-1">
        <TableHeader>
          <TableRow className="border-0 text-[13px] hover:bg-transparent">
            <TableHead className="w-10 px-3 text-muted-foreground" />
            <TableHead className="min-w-72 px-3 text-muted-foreground">
              ID
            </TableHead>
            <TableHead className="px-3 text-muted-foreground">Status</TableHead>
            <TableHead className="min-w-48 px-3 text-muted-foreground">
              Type
            </TableHead>
            <TableHead className="min-w-44 px-3 text-muted-foreground">
              Sent at
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.length ? (
            deliveries.map((delivery) => {
              const isExpanded = expandedDeliveryId === delivery.id;

              return (
                <Fragment key={delivery.id}>
                  <TableRow
                    className="cursor-pointer border-0 bg-background hover:bg-background/80"
                    onClick={() =>
                      setExpandedDeliveryId(isExpanded ? null : delivery.id)
                    }
                  >
                    <TableCell className="rounded-l-[14px] px-3 py-4">
                      <Button
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded ? "Collapse delivery" : "Expand delivery"
                        }
                        className="size-7 p-0"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedDeliveryId(
                            isExpanded ? null : delivery.id
                          );
                        }}
                        type="button"
                        variant="ghost"
                      >
                        {isExpanded ? (
                          <CaretDownIcon className="size-4" />
                        ) : (
                          <CaretRightIcon className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="px-3 py-4">
                      <p className="max-w-72 break-all font-mono text-xs">
                        {delivery.id}
                      </p>
                    </TableCell>
                    <TableCell className="px-3 py-4">
                      <DeliveryStatus status={delivery.status} />
                    </TableCell>
                    <TableCell className="px-3 py-4">
                      <p className="font-mono text-xs">{delivery.eventType}</p>
                    </TableCell>
                    <TableCell className="rounded-r-[14px] px-3 py-4">
                      <p className="text-sm">
                        {format(new Date(delivery.createdAt), "MMM d, h:mm a")}
                      </p>
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow className="border-0 bg-background hover:bg-background">
                      <TableCell
                        className="rounded-[14px] px-6 py-5"
                        colSpan={5}
                      >
                        <DeliveryDetails delivery={delivery} />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          ) : (
            <TableRow className="border-0 bg-background">
              <TableCell
                className="h-28 rounded-[14px] text-center text-muted-foreground text-sm"
                colSpan={5}
              >
                No deliveries found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function DeliveryDetails({ delivery }: { delivery: WebhookDelivery }) {
  const payload = JSON.stringify(delivery.payload, null, 2);
  const latestAttempt = delivery.latestAttempt;
  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      toast.success("Copied payload");
    } catch {
      toast.error("Could not copy payload");
    }
  };

  return (
    <div className="grid gap-5">
      <dl className="grid gap-3 text-sm md:grid-cols-[180px_minmax(0,1fr)]">
        <DetailItem label="Event ID" value={delivery.eventId} />
        <DetailItem label="Event timestamp" value={delivery.eventCreatedAt} />
        <DetailItem label="Delivery ID" value={delivery.id} />
        <DetailItem
          label="Sent at"
          value={delivery.lastAttemptAt ?? delivery.createdAt}
        />
        <DetailItem
          label="HTTP response"
          value={
            latestAttempt?.statusCode
              ? String(latestAttempt.statusCode)
              : "No response"
          }
        />
        <DetailItem
          label="Duration"
          value={
            latestAttempt?.durationMs !== null &&
            latestAttempt?.durationMs !== undefined
              ? `${latestAttempt.durationMs}ms`
              : "-"
          }
        />
      </dl>

      {latestAttempt?.errorMessage ? (
        <div className="rounded-[14px] border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
          {latestAttempt.errorMessage}
        </div>
      ) : null}

      <div className="grid gap-3 border-t border-dashed pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium text-sm">Payload</h3>
          <Button
            className="h-8 px-3 text-xs"
            onClick={copyPayload}
            type="button"
            variant="outline"
          >
            <HugeiconsIcon className="size-3.5" icon={Copy01Icon} />
            Copy payload
          </Button>
        </div>
        <pre className="max-h-[520px] overflow-auto rounded-[14px] border border-dashed bg-background p-4 font-mono text-xs leading-relaxed">
          {payload}
        </pre>
      </div>
    </div>
  );
}

function WebhookSettingsPanel({
  onUpdated,
  webhook,
}: {
  onUpdated: (webhook: Webhook) => void;
  webhook: Webhook;
}) {
  const [name, setName] = useState(webhook.name);
  const [endpoint, setEndpoint] = useState(webhook.url);
  const [formatValue, setFormatValue] = useState(webhook.format);
  const [enabled, setEnabled] = useState(webhook.enabled);
  const [events, setEvents] = useState<WebhookEvent[]>(
    webhook.events as WebhookEvent[]
  );

  useEffect(() => {
    setName(webhook.name);
    setEndpoint(webhook.url);
    setFormatValue(webhook.format);
    setEnabled(webhook.enabled);
    setEvents(webhook.events as WebhookEvent[]);
  }, [webhook]);

  const hasChanges =
    name !== webhook.name ||
    endpoint !== webhook.url ||
    formatValue !== webhook.format ||
    enabled !== webhook.enabled ||
    events.join(",") !== webhook.events.join(",");

  const { isPending, mutate: updateWebhook } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        body: JSON.stringify({
          name: name.trim(),
          endpoint: endpoint.trim(),
          format: formatValue,
          events,
          enabled,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update webhook");
      }

      return response.json() as Promise<Webhook>;
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update webhook"
      );
    },
    onSuccess: (updatedWebhook) => {
      onUpdated(updatedWebhook);
      toast.success("Saved webhook");
    },
  });

  const allSelected = events.length === webhookEvents.length;

  const toggleEvent = (eventId: WebhookEvent, checked: boolean) => {
    setEvents((current) =>
      checked
        ? [...current, eventId]
        : current.filter((event) => event !== eventId)
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-13 shrink-0 items-center border-b border-dashed px-5">
        <h2 className="font-medium text-lg">Edit webhook</h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
        <div className="flex items-center justify-between gap-4 rounded-[14px] border px-3 py-2">
          <Label className="text-sm" htmlFor="webhook-enabled">
            Enabled
          </Label>
          <Switch
            checked={enabled}
            id="webhook-enabled"
            onCheckedChange={setEnabled}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="webhook-name">Name</Label>
          <Input
            id="webhook-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="webhook-endpoint">URL</Label>
          <Input
            id="webhook-endpoint"
            onChange={(event) => setEndpoint(event.target.value)}
            value={endpoint}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="webhook-format">Format</Label>
          <Select
            onValueChange={(nextFormat) => {
              if (nextFormat) {
                setFormatValue(nextFormat);
              }
            }}
            value={formatValue}
          >
            <SelectTrigger className="w-full shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formatOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label>Events</Label>
            <Button
              className="h-8 px-2 text-xs"
              onClick={() =>
                setEvents(
                  allSelected ? [] : webhookEvents.map((event) => event.id)
                )
              }
              type="button"
              variant="outline"
            >
              {allSelected ? "Clear" : "Select all"}
            </Button>
          </div>
          <div className="grid gap-2">
            {webhookEvents.map((event) => (
              <label
                className="flex cursor-pointer items-center gap-3 text-sm"
                htmlFor={`webhook-event-${event.id}`}
                key={event.id}
              >
                <Checkbox
                  checked={events.includes(event.id)}
                  id={`webhook-event-${event.id}`}
                  onCheckedChange={(checked) =>
                    toggleEvent(event.id, Boolean(checked))
                  }
                />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {event.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-dashed p-4">
        <Button
          className="w-full"
          disabled={
            !hasChanges || isPending || !name.trim() || events.length === 0
          }
          onClick={() => updateWebhook()}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function FilterSelect({
  items,
  onValueChange,
  value,
}: {
  items: Array<{ label: string; value: string }>;
  onValueChange: (value: string) => void;
  value: string;
}) {
  return (
    <Select
      items={items}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange(nextValue);
        }
      }}
      value={value}
    >
      <SelectTrigger className="h-9 w-auto min-w-40 rounded-[12px] shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DeliveryStatus({ status }: { status: string }) {
  const isSuccess = status === "success";
  const isFailed = status === "failed";

  return (
    <Badge
      className={cn(
        "rounded-[6px] text-xs capitalize",
        isSuccess && "text-emerald-500",
        isFailed && "text-destructive"
      )}
      variant={isSuccess ? "positive" : isFailed ? "destructive" : "neutral"}
    >
      {status}
    </Badge>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all font-mono text-xs">{value}</dd>
    </>
  );
}
