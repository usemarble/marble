"use client";

import { toast } from "@marble/ui/components/sonner";
import { Switch } from "@marble/ui/components/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardBody } from "@/components/layout/wrapper";
import { PageError } from "@/components/shared/page-error";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import {
  type NotificationToggleItem,
  USER_NOTIFICATION_ITEMS,
  WORKSPACE_NOTIFICATION_ITEMS,
} from "@/lib/notifications";
import { orpc } from "@/lib/orpc";
import Loading from "./loading";

function NotificationToggle({
  item,
  checked,
  onToggle,
  isPending,
}: {
  item: NotificationToggleItem;
  checked: boolean;
  onToggle: (item: NotificationToggleItem, value: boolean) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-8 rounded-[14px] bg-background px-4 py-3.5">
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-sm">{item.label}</p>
        <p className="text-[13px] text-muted-foreground">{item.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Switch
          checked={checked}
          disabled={isPending}
          onCheckedChange={(value) => onToggle(item, value)}
        />
      </div>
    </div>
  );
}

interface NotificationGroupProps {
  title: string;
  description: string;
  items: NotificationToggleItem[];
  getChecked: (item: NotificationToggleItem) => boolean;
  isTogglePending: (item: NotificationToggleItem) => boolean;
  onToggle: (item: NotificationToggleItem, value: boolean) => void;
}

function NotificationGroup({
  title,
  description,
  items,
  getChecked,
  isTogglePending,
  onToggle,
}: NotificationGroupProps) {
  return (
    <div className="flex flex-col gap-1 rounded-[20px] bg-surface p-1.5">
      <div className="flex flex-col gap-0.5 px-4 py-2">
        <h2 className="font-medium text-sm">{title}</h2>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <NotificationToggle
            checked={getChecked(item)}
            isPending={isTogglePending(item)}
            item={item}
            key={item.key}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function PageClient() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery(
    orpc.me.notifications.get.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
      enabled: Boolean(workspaceId),
    })
  );

  const {
    mutate: toggle,
    variables: pendingToggle,
    isPending: isToggleMutationPending,
  } = useMutation(
    orpc.me.notifications.update.mutationOptions({
      onMutate: async ({ workspaceId: id, scope, key, value }) => {
        const queryKey = orpc.me.notifications.get.queryKey({
          input: { workspaceId: id },
        });
        await queryClient.cancelQueries({ queryKey });

        const previous = queryClient.getQueryData(queryKey);
        if (previous) {
          queryClient.setQueryData(queryKey, {
            ...previous,
            [scope]: {
              ...previous[scope],
              [key]: value,
            },
          });
        }

        return { previous, queryKey };
      },
      onSuccess: (_data, variables) => {
        toast.success(
          `${variables.value ? "Enabled" : "Disabled"} notification preference`
        );
      },
      onError: (_error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(context.queryKey, context.previous);
        }
        toast.error("Failed to update preference");
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.me.notifications.key(),
        });
      },
    })
  );

  if (!workspaceId || isLoading) {
    return <Loading />;
  }

  if (error || !preferences) {
    return (
      <PageError
        message={error?.message ?? "Failed to load notification preferences"}
        title="Unable to load notification preferences"
      />
    );
  }

  const handleToggle = (item: NotificationToggleItem, value: boolean) => {
    toggle({ workspaceId, scope: item.scope, key: item.key, value });
  };

  const isPending = (item: NotificationToggleItem) =>
    isToggleMutationPending &&
    pendingToggle?.scope === item.scope &&
    pendingToggle?.key === item.key;

  const getChecked = (item: NotificationToggleItem): boolean =>
    (preferences[item.scope] as Record<string, boolean>)[item.key] ?? false;

  return (
    <DashboardBody className="flex flex-col gap-8 py-12" size="compact">
      <NotificationGroup
        description="These apply to your account across all workspaces."
        getChecked={getChecked}
        isTogglePending={isPending}
        items={USER_NOTIFICATION_ITEMS}
        onToggle={handleToggle}
        title="Personal"
      />

      <NotificationGroup
        description="Applies to your current workspace. Critical notifications like payment failures and security alerts are always sent."
        getChecked={getChecked}
        isTogglePending={isPending}
        items={WORKSPACE_NOTIFICATION_ITEMS}
        onToggle={handleToggle}
        title="Workspace"
      />
    </DashboardBody>
  );
}

export default PageClient;
