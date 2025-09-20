"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Badge } from "@marble/ui/components/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { CalendarIcon, ClockClockwiseIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import Link from "next/link";
import { useWorkspace } from "@/providers/workspace";
import type { Post } from "./columns";
import PostActions from "./post-actions";

type DataGridProps = {
  data: Post[];
};

export function DataGrid({ data }: DataGridProps) {
  const { activeWorkspace } = useWorkspace();

  if (!activeWorkspace) {
    return null;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">No posts found.</p>
      </div>
    );
  }

  return (
    <ul className="grid auto-rows-fr gap-6 md:grid-cols-2">
      {data.map((post) => (
        <li key={post.id} className="h-full">
          <Card className="h-full gap-0 rounded-[20px] border-none bg-sidebar p-2 pb-0">
            <Link
              href={`/${activeWorkspace?.slug}/editor/p/${post.id}`}
              className="flex h-full min-h-[170px] flex-col rounded-[12px] bg-background p-5 shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <CardHeader className="gap-y-0 px-0 pb-3">
                <div className="flex items-start justify-between gap-8">
                  <CardTitle className="mr-2 line-clamp-2 flex-1 font-medium leading-[1.4]">
                    {post.title}
                  </CardTitle>
                  <div>
                    <PostActions post={post} view="grid" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex- flexcol mt-auto flex items-center justify-between px-0 pt-0">
                <div className="space-y-3">
                  <Badge
                    variant={
                      post.status === "published" ? "positive" : "pending"
                    }
                  >
                    {post.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CalendarIcon className="size-5 cursor-default" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Published: {format(post.publishedAt, "MMM dd, yyyy")}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ClockClockwiseIcon className="size-5 cursor-default" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Last Updated: {format(post.updatedAt, "MMM dd, yyyy")}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Link>
            <CardFooter className="px-2 py-2.5">
              <ul className="-space-x-2 flex items-center">
                {post.authors.map((author) => (
                  <li key={author.id} className="flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="size-8 border-2 border-background">
                          <AvatarImage src={author.image || undefined} />
                          <AvatarFallback>
                            {author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-64 text-xs">{author.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
