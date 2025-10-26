"use client";

import { buttonVariants } from "@marble/ui/components/button";
import { NoteIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import { columns, type Post } from "@/components/posts/columns";
import { PostDataView } from "@/components/posts/data-view";
import PageLoader from "@/components/shared/page-loader";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

function PageClient() {
	const { activeWorkspace } = useWorkspace();

	const { data: posts, isLoading } = useQuery({
		queryKey: QUERY_KEYS.POSTS(activeWorkspace?.id ?? ""),
		staleTime: 1000 * 60 * 60,
		queryFn: async () => {
			try {
				const res = await fetch("/api/posts");
				if (!res.ok) {
					throw new Error("Failed to fetch posts");
				}
				const data: Post[] = await res.json();
				return data;
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to fetch posts",
				);
			}
		},
		enabled: !!activeWorkspace?.id,
	});

	if (isLoading) {
		return <PageLoader />;
	}

	return (
		<WorkspacePageWrapper className="flex flex-col gap-8 pt-10 pb-16">
			{posts && posts.length > 0 ? (
				<PostDataView columns={columns} data={posts} />
			) : (
				<WorkspacePageWrapper className="grid h-full place-content-center">
					<div className="flex max-w-80 flex-col items-center gap-4">
						<div className="p-2">
							<NoteIcon className="size-16" />
						</div>
						<div className="flex flex-col items-center gap-4 text-center">
							<p className="text-muted-foreground text-sm">
								No posts yet. Click the button below to start writing.
							</p>
							<Link
								className={buttonVariants({ variant: "default" })}
								href={`/${activeWorkspace?.slug}/editor/p/new`}
							>
								<PlusIcon size={16} />
								<span>New Post</span>
							</Link>
						</div>
					</div>
				</WorkspacePageWrapper>
			)}
		</WorkspacePageWrapper>
	);
}

export default PageClient;
