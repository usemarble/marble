"use client";

import { buttonVariants } from "@marble/ui/components/button";
import { Folder } from "@phosphor-icons/react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { columns, type Post } from "@/components/posts/columns";
import { PostDataTable } from "@/components/posts/data-table";

interface PageClientProps {
  posts: Post[];
}

function PageClient({ posts }: PageClientProps) {
  const params = useParams<{ workspace: string }>();

  return (
    <WorkspacePageWrapper className="flex flex-col pt-10 pb-16 gap-8">
      {posts.length > 0 ? (
        <PostDataTable columns={columns} data={posts} />
      ) : (
        <div className="grid h-full w-full place-content-center">
          <div className="flex flex-col items-center">
            <Folder className="size-16 stroke-[1px] text-muted-foreground" />
            <div className="flex flex-col items-center gap-10">
              <p className="text-balance max-w-xl mx-auto text-center text-muted-foreground text-sm">
                No posts yet. Click the button below to start writing.
              </p>
              <Link
                href={`/${params.workspace}/editor/p/new`}
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                <Plus size={16} />
                <span>New post</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </WorkspacePageWrapper>
  );
}

export default PageClient;
