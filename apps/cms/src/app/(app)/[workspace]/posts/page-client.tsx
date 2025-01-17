"use client";

import { Folder } from "@/components/icons/isometric";
import { type Post, columns } from "@/components/posts/columns";
import { PostDataTable } from "@/components/posts/data-table";
import { Button, buttonVariants } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Plus, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PageClientProps {
  posts: Post[];
}

function PageClient({ posts }: PageClientProps) {
  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto pt-16">
      {posts.length > 0 ? (
        <PostDataTable columns={columns} data={posts} />
      ) : (
        <div className="grid h-full w-full place-content-center">
          <div className="flex flex-col items-center">
            <Folder className="size-40 text-primary" />
            <div className="flex flex-col items-center gap-10">
              <p className="text-balance max-w-2xl mx-auto text-center text-muted-foreground">
                No articles yet. Click the button below to start writing.
              </p>
              <Link
                href="/editor"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                <Plus size={16} />
                <span>New article</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PageClient;
