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
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No posts found.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-6 md:grid-cols-2 auto-rows-fr">
      {data.map((post) => (
        <li key={post.id} className="h-full">
          <Card className="bg-sidebar border-none p-2 pb-0 gap-0 rounded-[20px] h-full">
            <Link
              href={`/${activeWorkspace?.slug}/editor/p/${post.id}`}
              className="outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-background p-5 flex flex-col rounded-[12px] min-h-[170px] shadow-sm h-full"
            >
              <CardHeader className="pb-3 gap-y-0 px-0">
                <div className="flex items-start gap-8 justify-between">
                  <CardTitle className="font-medium leading-[1.4] line-clamp-2 flex-1 mr-2">
                    {post.title}
                  </CardTitle>
                  <div>
                    <PostActions post={post} view="grid" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-0 flex- mt-auto flex justify-between items-center flexcol">
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
            <CardFooter className="py-2.5 px-2">
              <ul className="flex items-center -space-x-2">
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
