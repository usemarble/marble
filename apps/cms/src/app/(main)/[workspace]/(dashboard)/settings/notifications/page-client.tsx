"use client";

import { toast } from "@marble/ui/components/sonner";
import { Switch } from "@marble/ui/components/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardBody } from "@/components/layout/wrapper";
import { NotificationsSettingsSkeleton } from "@/components/settings/loading-skeletons";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  type NotificationToggleItem,
  USER_NOTIFICATION_ITEMS,
  WORKSPACE_NOTIFICATION_ITEMS,
} from "@/lib/notifications";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { request } from "@/utils/fetch/client";

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

  const { data: preferences, isLoading } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATION_PREFERENCES,
    queryFn: async () => {
      const response =
        await request<NotificationPreferences>("user/notifications");
      return response.data;
    },
  });

  const {
    mutate: toggle,
    variables: pendingToggle,
    isPending: isToggleMutationPending,
  } = useMutation({
    mutationFn: async ({
      scope,
      key,
      value,
    }: {
      scope: "user" | "workspace";
      key: string;
      value: boolean;
    }) => {
      const response = await request("user/notifications", "PATCH", {
        scope,
        key,
        value,
      });
      return response.data;
    },
    onMutate: async ({ scope, key, value }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.NOTIFICATION_PREFERENCES,
      });

      const previous = queryClient.getQueryData<NotificationPreferences>(
        QUERY_KEYS.NOTIFICATION_PREFERENCES
      );

      const current = previous ?? DEFAULT_NOTIFICATION_PREFERENCES;

      queryClient.setQueryData<NotificationPreferences>(
        QUERY_KEYS.NOTIFICATION_PREFERENCES,
        {
          ...current,
          [scope]: {
            ...current[scope],
            [key]: value,
          },
        }
      );

      return { previous };
    },
    onSuccess: (_data, variables) => {
      toast.success(
        `${variables.value ? "Enabled" : "Disabled"} notification preference`
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          QUERY_KEYS.NOTIFICATION_PREFERENCES,
          context.previous
        );
      }
      toast.error("Failed to update preference");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.NOTIFICATION_PREFERENCES,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.USER,
      });
    },
  });

  const handleToggle = (item: NotificationToggleItem, value: boolean) => {
    toggle({ scope: item.scope, key: item.key, value });
  };

  const isPending = (item: NotificationToggleItem) =>
    isToggleMutationPending &&
    pendingToggle?.scope === item.scope &&
    pendingToggle?.key === item.key;

  const getChecked = (item: NotificationToggleItem): boolean => {
    const source = preferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
    const scopePrefs = source[item.scope];
    return (scopePrefs as Record<string, boolean>)[item.key] ?? false;
  };

  if (isLoading) {
    return <NotificationsSettingsSkeleton />;
  }

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
