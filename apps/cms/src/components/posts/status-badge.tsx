"use client";

import { Badge } from "@marble/ui/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import type { PostStatus } from "@marble/utils/post-status";
import {
  formatScheduledDate,
  POST_STATUS_PRESENTATION,
} from "@/lib/post-status";

export function PostStatusBadge({
  className,
  publishedAt,
  status,
}: {
  className?: string;
  publishedAt: Date;
  status: PostStatus;
}) {
  const presentation = POST_STATUS_PRESENTATION[status];
  const badge = (
    <Badge className={className} variant={presentation.variant}>
      {presentation.label}
    </Badge>
  );
  if (status !== "scheduled") {
    return badge;
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>{badge}</TooltipTrigger>
      <TooltipContent>
        {presentation.dateLabel}: {formatScheduledDate(new Date(publishedAt))}
      </TooltipContent>
    </Tooltip>
  );
}
