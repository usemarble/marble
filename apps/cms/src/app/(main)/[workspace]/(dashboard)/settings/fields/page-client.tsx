"use client";

import { DatabaseIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
import { cn } from "@marble/ui/lib/utils";
import {
  ArrowUpRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { DashboardBody } from "@/components/layout/wrapper";
import { FieldsSettingsSkeleton } from "@/components/settings/loading-skeletons";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { CustomField } from "@/types/fields";

const CreateCustomFieldSheet = dynamic(
  () => import("@/components/fields/create-custom-field")
);

const CustomFieldRow = dynamic(() =>
  import("@/components/fields/custom-field-row").then(
    (mod) => mod.CustomFieldRow
  )
);

const fieldTypeLabels: Record<string, string> = {
  text: "Text",
  number: "Number",
  boolean: "Boolean",
  date: "Date",
  richtext: "Rich Text",
  select: "Select",
  multiselect: "Multi Select",
};

export function PageClient({
  initialFields,
}: {
  initialFields?: CustomField[];
}) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const docsHref = "https://docs.marblecms.com/features/custom-fields";
  const [search, setSearch] = useState("");

  const {
    data: fields,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.CUSTOM_FIELDS(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/fields");
      if (!res.ok) {
        throw new Error(
          `Failed to fetch custom fields: ${res.status} ${res.statusText}`
        );
      }
      const data: CustomField[] = await res.json();
      return data;
    },
    enabled: !!workspaceId,
    initialData: initialFields,
  });

  if (!workspaceId || isLoading) {
    return <FieldsSettingsSkeleton />;
  }

  if (isError) {
    return (
      <DashboardBody
        className="grid h-full place-content-center"
        size="compact"
      >
        <div className="flex max-w-96 flex-col items-center gap-4 text-center">
          <p className="font-medium">Unable to load custom fields</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading your workspace fields."}
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardBody>
    );
  }

  if (fields?.length === 0) {
    return (
      <DashboardBody
        className="grid h-full place-content-center"
        size="compact"
      >
        <div className="flex max-w-80 flex-col items-center gap-4">
          <div className="p-2">
            <HugeiconsIcon className="size-16" icon={DatabaseIcon} />
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-sm">
              Extend the default post schema with custom fields. Define text,
              number, boolean, date, or rich text fields that can be set on
              every post.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <CreateCustomFieldSheet>
                <Button>
                  <PlusIcon className="size-4" />
                  New Field
                </Button>
              </CreateCustomFieldSheet>
              <a
                className={cn(buttonVariants({ variant: "outline" }))}
                href={docsHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                Learn more
                <ArrowUpRightIcon className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </DashboardBody>
    );
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredFields = normalizedSearch
    ? (fields?.filter((field) =>
        field.name.toLowerCase().includes(normalizedSearch)
      ) ?? [])
    : (fields ?? []);

  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <MagnifyingGlassIcon
              className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
              size={16}
            />
            <Input
              aria-label="Search custom fields"
              className="h-9 w-full rounded-[12px] px-8 shadow-none sm:w-72"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search custom fields..."
              value={search}
            />
            {search ? (
              <button
                aria-label="Clear search"
                className="-translate-y-1/2 absolute top-1/2 right-3"
                onClick={() => setSearch("")}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </div>
          <CreateCustomFieldSheet>
            <Button>
              <PlusIcon className="size-4" />
              New Field
            </Button>
          </CreateCustomFieldSheet>
        </div>

        <div className="overflow-hidden rounded-[20px] bg-surface p-1 [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-container]]:overflow-y-hidden">
          <Table className="-mb-1 h-fit min-w-[640px] border-separate border-spacing-y-1">
            <TableHeader>
              <TableRow className="border-0 text-[13px] hover:bg-transparent">
                <TableHead className="px-3 text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="px-3 text-muted-foreground">
                  Key
                </TableHead>
                <TableHead className="px-3 text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="w-12 px-3 text-right text-muted-foreground">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields.length > 0 ? (
                filteredFields.map((field) => (
                  <CustomFieldRow
                    field={field}
                    fieldTypeLabels={fieldTypeLabels}
                    key={field.id}
                    onDelete={() => {
                      if (workspaceId) {
                        queryClient.invalidateQueries({
                          queryKey: QUERY_KEYS.CUSTOM_FIELDS(workspaceId),
                        });
                      }
                    }}
                  />
                ))
              ) : (
                <TableRow className="border-0 bg-background">
                  <TableCell
                    className="h-28 rounded-[14px] text-center text-muted-foreground text-sm"
                    colSpan={4}
                  >
                    No custom fields match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardBody>
  );
}

export default PageClient;
