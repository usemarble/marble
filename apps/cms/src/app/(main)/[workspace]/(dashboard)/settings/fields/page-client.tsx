"use client";

import { DatabaseIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, buttonVariants } from "@marble/ui/components/button";
import { cn } from "@marble/ui/lib/utils";
import { ArrowUpRightIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
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

export function PageClient() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const docsHref = "https://docs.marblecms.com/guides/features/custom-fields";

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
  });

  if (!workspaceId || isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <WorkspacePageWrapper
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
      </WorkspacePageWrapper>
    );
  }

  if (fields?.length === 0) {
    return (
      <WorkspacePageWrapper
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
      </WorkspacePageWrapper>
    );
  }

  return (
    <WorkspacePageWrapper
      className="flex flex-col gap-8 pt-10 pb-16"
      size="compact"
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div />
          <CreateCustomFieldSheet>
            <Button>
              <PlusIcon className="size-4" />
              New Field
            </Button>
          </CreateCustomFieldSheet>
        </div>

        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b text-muted-foreground text-sm">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Key</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fields?.map((field) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
