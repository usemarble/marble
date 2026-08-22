import { Skeleton } from "@marble/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import type { ReactNode } from "react";
import { DashboardBody } from "@/components/layout/wrapper";

const tableRows = [
  "row-1",
  "row-2",
  "row-3",
  "row-4",
  "row-5",
  "row-6",
  "row-7",
  "row-8",
];

const fieldRows = [
  "field-1",
  "field-2",
  "field-3",
  "field-4",
  "field-5",
  "field-6",
];

const deliveryRows = [
  "delivery-1",
  "delivery-2",
  "delivery-3",
  "delivery-4",
  "delivery-5",
];

const featureRows = ["feature-1", "feature-2", "feature-3", "feature-4"];

const fieldHeaders = [
  { id: "name", width: "w-16" },
  { id: "key", width: "w-10" },
  { id: "type", width: "w-12" },
  { id: "actions", width: "w-8" },
];

const deliveryHeaders = [
  { id: "expand", width: "w-4" },
  { id: "id", width: "w-8" },
  { id: "status", width: "w-12" },
  { id: "type", width: "w-10" },
  { id: "sent-at", width: "w-14" },
];

interface SettingsSectionSkeletonProps {
  children: ReactNode;
  descriptionWidth?: string;
  titleWidth?: string;
}

function SettingsSectionSkeleton({
  children,
  descriptionWidth = "w-80 max-w-full",
  titleWidth = "w-32",
}: SettingsSectionSkeletonProps) {
  return (
    <div className="flex flex-col gap-1 rounded-[20px] bg-surface p-1.5">
      <div className="flex flex-col gap-1.5 px-4 py-2">
        <Skeleton className={`h-4 ${titleWidth}`} />
        <Skeleton className={`h-3 ${descriptionWidth}`} />
      </div>
      {children}
    </div>
  );
}

function InputActionSkeleton({
  actionWidth = "w-20",
}: {
  actionWidth?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-start">
      <Skeleton className="h-9 min-w-0 flex-1 rounded-md" />
      <Skeleton className={`h-9 self-end rounded-md ${actionWidth}`} />
    </div>
  );
}

function MediaInputSkeleton() {
  return (
    <div className="flex items-center gap-6 rounded-[14px] bg-background px-4 py-3.5">
      <Skeleton className="size-16 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton className="h-9 min-w-0 flex-1 rounded-md" />
        <Skeleton className="size-9 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

function ActionRowSkeleton({ actionWidth = "w-28" }: { actionWidth?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
      </div>
      <Skeleton className={`h-9 shrink-0 rounded-md ${actionWidth}`} />
    </div>
  );
}

function TextInputSkeleton() {
  return (
    <div className="rounded-[14px] bg-background px-4 py-3.5">
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

export function GeneralSettingsSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <SettingsSectionSkeleton
        descriptionWidth="w-[430px] max-w-full"
        titleWidth="w-28"
      >
        <InputActionSkeleton />
      </SettingsSectionSkeleton>
      <SettingsSectionSkeleton
        descriptionWidth="w-80 max-w-full"
        titleWidth="w-28"
      >
        <InputActionSkeleton />
      </SettingsSectionSkeleton>
      <SettingsSectionSkeleton
        descriptionWidth="w-[520px] max-w-full"
        titleWidth="w-28"
      >
        <MediaInputSkeleton />
      </SettingsSectionSkeleton>
      <SettingsSectionSkeleton
        descriptionWidth="w-[420px] max-w-full"
        titleWidth="w-32"
      >
        <InputActionSkeleton />
      </SettingsSectionSkeleton>
      <SettingsSectionSkeleton
        descriptionWidth="w-72 max-w-full"
        titleWidth="w-24"
      >
        <InputActionSkeleton actionWidth="w-9" />
      </SettingsSectionSkeleton>
      <SettingsSectionSkeleton
        descriptionWidth="w-[560px] max-w-full"
        titleWidth="w-32"
      >
        <ActionRowSkeleton actionWidth="w-36" />
      </SettingsSectionSkeleton>
    </DashboardBody>
  );
}

export function AccountSettingsSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <SettingsSectionSkeleton
        descriptionWidth="w-[360px] max-w-full"
        titleWidth="w-16"
      >
        <MediaInputSkeleton />
      </SettingsSectionSkeleton>
      <SettingsSectionSkeleton
        descriptionWidth="w-[420px] max-w-full"
        titleWidth="w-20"
      >
        <InputActionSkeleton />
      </SettingsSectionSkeleton>
      <SettingsSectionSkeleton
        descriptionWidth="w-[440px] max-w-full"
        titleWidth="w-14"
      >
        <TextInputSkeleton />
      </SettingsSectionSkeleton>
      <SettingsSectionSkeleton
        descriptionWidth="w-[460px] max-w-full"
        titleWidth="w-28"
      >
        <ActionRowSkeleton actionWidth="w-32" />
      </SettingsSectionSkeleton>
    </DashboardBody>
  );
}

function NotificationRowSkeleton({
  descriptionWidth,
}: {
  descriptionWidth: string;
}) {
  return (
    <div className="flex items-center justify-between gap-8 rounded-[14px] bg-background px-4 py-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className={`h-3 max-w-full ${descriptionWidth}`} />
      </div>
      <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
    </div>
  );
}

function NotificationGroupSkeleton() {
  return (
    <div className="flex flex-col gap-1 rounded-[20px] bg-surface p-1.5">
      <div className="flex flex-col gap-1.5 px-4 py-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-[430px] max-w-full" />
      </div>
      <div className="flex flex-col gap-1.5">
        <NotificationRowSkeleton descriptionWidth="w-[570px]" />
        <NotificationRowSkeleton descriptionWidth="w-[620px]" />
      </div>
    </div>
  );
}

export function NotificationsSettingsSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <NotificationGroupSkeleton />
      <NotificationGroupSkeleton />
    </DashboardBody>
  );
}

export function AppearanceSettingsSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <SettingsSectionSkeleton
        descriptionWidth="w-52 max-w-full"
        titleWidth="w-14"
      >
        <div className="flex flex-col gap-3 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <Skeleton className="h-4 w-52 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32 shrink-0 rounded-md" />
        </div>
      </SettingsSectionSkeleton>
    </DashboardBody>
  );
}

function DataHistoryRowSkeleton() {
  return (
    <div className="rounded-[14px] bg-background px-4 py-3.5">
      <Skeleton className="h-3 w-64 max-w-full" />
    </div>
  );
}

export function DataSettingsSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <SettingsSectionSkeleton
        descriptionWidth="w-[360px] max-w-full"
        titleWidth="w-24"
      >
        <div className="flex flex-col gap-1.5">
          <ActionRowSkeleton actionWidth="w-20" />
          <DataHistoryRowSkeleton />
        </div>
      </SettingsSectionSkeleton>
      <SettingsSectionSkeleton
        descriptionWidth="w-[570px] max-w-full"
        titleWidth="w-36"
      >
        <ActionRowSkeleton actionWidth="w-26" />
      </SettingsSectionSkeleton>
    </DashboardBody>
  );
}

interface TableColumnSkeleton {
  cellWidth: string;
  headerWidth: string;
  id: string;
  kind?: "actions" | "avatar" | "badge" | "checkbox" | "stack" | "text";
}

const memberColumns: TableColumnSkeleton[] = [
  { cellWidth: "w-40", headerWidth: "w-16", id: "user", kind: "avatar" },
  { cellWidth: "w-16", headerWidth: "w-12", id: "role", kind: "badge" },
  { cellWidth: "w-7", headerWidth: "w-10", id: "actions", kind: "actions" },
];

const keyColumns: TableColumnSkeleton[] = [
  { cellWidth: "w-28", headerWidth: "w-12", id: "name" },
  { cellWidth: "w-16", headerWidth: "w-10", id: "type", kind: "badge" },
  { cellWidth: "w-24", headerWidth: "w-8", id: "key" },
  { cellWidth: "w-20", headerWidth: "w-16", id: "created" },
  { cellWidth: "w-20", headerWidth: "w-16", id: "last-used" },
  { cellWidth: "w-7", headerWidth: "w-10", id: "actions", kind: "actions" },
];

const webhookColumns: TableColumnSkeleton[] = [
  { cellWidth: "w-4", headerWidth: "w-4", id: "select", kind: "checkbox" },
  { cellWidth: "w-32", headerWidth: "w-12", id: "name", kind: "stack" },
  { cellWidth: "w-52", headerWidth: "w-20", id: "endpoint" },
  { cellWidth: "w-16", headerWidth: "w-12", id: "status", kind: "badge" },
  { cellWidth: "w-20", headerWidth: "w-14", id: "created" },
  { cellWidth: "w-7", headerWidth: "w-10", id: "actions", kind: "actions" },
];

interface TableActionSkeleton {
  id: string;
  width: string;
}

function TableCellContentSkeleton({ column }: { column: TableColumnSkeleton }) {
  switch (column.kind) {
    case "actions":
      return <Skeleton className="ml-auto size-7 rounded-md" />;
    case "avatar":
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className={`h-3 ${column.cellWidth}`} />
            <Skeleton className="h-3 w-48 max-w-full" />
          </div>
        </div>
      );
    case "badge":
      return <Skeleton className={`h-5 rounded-[6px] ${column.cellWidth}`} />;
    case "checkbox":
      return <Skeleton className="size-4 rounded" />;
    case "stack":
      return (
        <div className="flex flex-col gap-2">
          <Skeleton className={`h-3 ${column.cellWidth}`} />
          <Skeleton className="h-3 w-12" />
        </div>
      );
    default:
      return <Skeleton className={`h-3 ${column.cellWidth}`} />;
  }
}

function SettingsTableSkeleton({
  actions,
  columns,
}: {
  actions: TableActionSkeleton[];
  columns: TableColumnSkeleton[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-9 w-full rounded-[12px] sm:w-72" />
        <div className="flex items-center justify-end gap-2">
          {actions.map((action) => (
            <Skeleton
              className={`h-9 rounded-md ${action.width}`}
              key={action.id}
            />
          ))}
        </div>
      </section>

      <div className="overflow-hidden rounded-[20px] bg-surface p-1 [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-container]]:overflow-y-hidden">
        <Table className="-mb-1 h-fit min-w-[720px] border-separate border-spacing-y-1">
          <TableHeader>
            <TableRow className="border-0 text-[13px] hover:bg-transparent">
              {columns.map((column) => (
                <TableHead className="px-3" key={column.id}>
                  <Skeleton
                    className={`h-3 ${
                      column.kind === "actions" ? "ml-auto" : ""
                    } ${column.headerWidth}`}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow className="h-[60px] border-0 bg-background" key={row}>
                {columns.map((column) => (
                  <TableCell
                    className="px-3 py-2 first:rounded-l-[14px] last:rounded-r-[14px]"
                    key={`${row}-${column.id}`}
                  >
                    <TableCellContentSkeleton column={column} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MembersSettingsSkeleton() {
  return (
    <DashboardBody size="compact">
      <div className="space-y-6">
        <SettingsTableSkeleton
          actions={[
            { id: "invite", width: "w-28" },
            { id: "leave", width: "w-28" },
          ]}
          columns={memberColumns}
        />
      </div>
    </DashboardBody>
  );
}

export function ApiKeysSettingsSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <SettingsTableSkeleton
        actions={[{ id: "new-key", width: "w-32" }]}
        columns={keyColumns}
      />
    </DashboardBody>
  );
}

export function WebhooksSettingsSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <SettingsTableSkeleton
        actions={[{ id: "add-endpoint", width: "w-32" }]}
        columns={webhookColumns}
      />
    </DashboardBody>
  );
}

export function FieldsSettingsSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-9 w-full rounded-[12px] sm:w-72" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        <div className="overflow-hidden rounded-[20px] bg-surface p-1 [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-container]]:overflow-y-hidden">
          <Table className="-mb-1 h-fit min-w-[640px] border-separate border-spacing-y-1">
            <TableHeader>
              <TableRow className="border-0 text-[13px] hover:bg-transparent">
                {fieldHeaders.map((header) => (
                  <TableHead className="px-3" key={header.id}>
                    <Skeleton
                      className={`h-3 ${
                        header.id === "actions" ? "ml-auto" : ""
                      } ${header.width}`}
                    />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fieldRows.map((row) => (
                <TableRow className="h-[60px] border-0 bg-background" key={row}>
                  <TableCell className="rounded-l-[14px] px-3 py-2">
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-5 w-28 rounded" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="rounded-r-[14px] px-3 py-2">
                    <Skeleton className="ml-auto size-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardBody>
  );
}

function PricingCardSkeleton() {
  return (
    <div className="rounded-[20px] bg-surface p-1">
      <div className="flex h-full flex-col gap-6 rounded-[16px] bg-background p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="flex flex-col gap-3">
          {featureRows.map((row, index) => (
            <div className="flex items-center gap-2" key={row}>
              <Skeleton className="size-4 shrink-0 rounded-full" />
              <Skeleton
                className={`h-3 ${index % 2 === 0 ? "w-36" : "w-44"}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BillingSettingsSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <div className="rounded-[20px] bg-surface p-1">
        <div className="flex items-center justify-between gap-6 rounded-[16px] bg-background p-6 shadow-xs">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <Skeleton className="h-9 w-40 shrink-0 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-4 w-[420px] max-w-full" />
          </div>
          <Skeleton className="h-5 w-40 shrink-0 rounded-full" />
        </div>
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PricingCardSkeleton />
          <PricingCardSkeleton />
          <PricingCardSkeleton />
        </section>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="rounded-[20px] bg-surface p-1">
          <div className="flex h-24 items-center justify-center rounded-[16px] bg-background px-4 shadow-xs">
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    </DashboardBody>
  );
}

function WebhookSettingsPanelSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-13 shrink-0 items-center border-b border-dashed px-5">
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-5">
        <div className="flex items-center justify-between rounded-[14px] border border-input px-3 py-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
        {["name", "url", "format"].map((field) => (
          <div className="grid gap-2" key={field}>
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          {featureRows.map((row) => (
            <div className="flex items-center gap-3" key={row}>
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t border-dashed p-4">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}

export function WebhookDetailSettingsSkeleton() {
  return (
    <DashboardBody
      contextView={<WebhookSettingsPanelSkeleton />}
      flush
      showHeader={false}
    >
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <div className="flex h-13 shrink-0 items-center gap-2 border-b border-dashed px-4">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>

        <section className="min-h-0 flex-1 overflow-hidden p-4 md:p-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-[520px] max-w-full" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-9 w-72 max-w-full rounded-lg" />
                  <Skeleton className="h-9 w-40 rounded-md" />
                </div>
                <Skeleton className="h-9 w-32 rounded-md" />
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <Skeleton className="h-6 w-24" />
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-9 w-40 rounded-[12px]" />
                <Skeleton className="h-9 w-44 rounded-[12px]" />
                <Skeleton className="h-9 w-40 rounded-[12px]" />
              </div>
              <div className="overflow-hidden rounded-[20px] bg-surface p-1 [&_[data-slot=table-container]]:overflow-x-auto">
                <Table className="-mb-1 h-fit min-w-[820px] border-separate border-spacing-y-1">
                  <TableHeader>
                    <TableRow className="border-0 hover:bg-transparent">
                      {deliveryHeaders.map((header) => (
                        <TableHead className="px-3" key={header.id}>
                          <Skeleton className={`h-3 ${header.width}`} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryRows.map((row) => (
                      <TableRow className="border-0 bg-background" key={row}>
                        <TableCell className="rounded-l-[14px] px-3 py-4">
                          <Skeleton className="size-7 rounded-md" />
                        </TableCell>
                        <TableCell className="px-3 py-4">
                          <Skeleton className="h-3 w-64" />
                        </TableCell>
                        <TableCell className="px-3 py-4">
                          <Skeleton className="h-5 w-16 rounded-[6px]" />
                        </TableCell>
                        <TableCell className="px-3 py-4">
                          <Skeleton className="h-3 w-36" />
                        </TableCell>
                        <TableCell className="rounded-r-[14px] px-3 py-4">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36" />
                <div className="flex gap-2">
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </DashboardBody>
  );
}
