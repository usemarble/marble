"use client";

import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { WebhookListItem } from "@/types/webhook";

const DeleteWebhookModal = dynamic(() =>
  import("@/components/webhooks/delete-webhook").then(
    (mod) => mod.DeleteWebhookModal
  )
);

interface WebhookActionsProps {
  webhook: WebhookListItem;
  onDelete: () => void;
}

export function WebhookActions({ webhook, onDelete }: WebhookActionsProps) {
  const params = useParams<{ workspace: string }>();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button className="size-8 p-0" variant="ghost">
              <span className="sr-only">Open webhook actions</span>
              <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
            </Button>
          }
        />
        <DropdownMenuContent
          align="end"
          className="text-muted-foreground shadow-sm"
        >
          <DropdownMenuItem
            onClick={() =>
              router.push(
                `/${params.workspace}/settings/webhooks/${webhook.id}`
              )
            }
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={16} />
            <span>Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            variant="destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteWebhookModal
        isOpen={isDeleteOpen}
        onDelete={onDelete}
        onOpenChange={setIsDeleteOpen}
        webhookId={webhook.id}
        webhookName={webhook.name}
      />
    </>
  );
}
