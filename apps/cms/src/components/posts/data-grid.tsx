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

interface DataGridProps {
  data: Post[];
}

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
        <li className="h-full" key={post.id}>
          <Card className="h-full gap-0 rounded-[20px] border-none bg-surface p-2 pb-0">
            <Link
              className="flex h-full min-h-[170px] flex-col rounded-[12px] bg-background p-5 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href={`/${activeWorkspace?.slug}/editor/p/${post.id}`}
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
              <CardContent className="mt-auto flex items-center justify-between px-0 pt-0">
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
                    <TooltipTrigger
                      render={
                        <CalendarIcon className="size-5 cursor-default" />
                      }
                    />
                    <TooltipContent>
                      Published: {format(post.publishedAt, "MMM dd, yyyy")}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <ClockClockwiseIcon className="size-5 cursor-default" />
                      }
                    />
                    <TooltipContent>
                      Last Updated: {format(post.updatedAt, "MMM dd, yyyy")}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Link>
            <CardFooter className="px-2 py-2.5">
              <ul className="flex items-center -space-x-2">
                {post.authors.map((author) => (
                  <li className="flex items-center" key={author.id}>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Avatar className="size-8 border-2 border-background">
                            <AvatarImage src={author.image || undefined} />
                            <AvatarFallback>
                              {author.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        }
                      />
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
