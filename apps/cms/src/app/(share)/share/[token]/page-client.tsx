"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@marble/ui/components/avatar";
import { format } from "date-fns";
import Image from "next/image";
import Prose from "@/components/share/prose";
import { LinkExpired, LinkNotFound } from "@/components/share/screens";
import type { SharePageClientProps } from "@/types/share";

function SharePageClient({ data, status }: SharePageClientProps) {
	if (status === "expired") {
		return <LinkExpired />;
	}

	if (!data) {
		return <LinkNotFound />;
	}

	const { post } = data;

	return (
		<div className="relative min-h-screen bg-background">
			<header className="border-b">
				<div className="container mx-auto flex items-center justify-between px-4 py-4">
					<div className="flex items-center gap-2">
						<Avatar className="size-8 border border-dashed">
							<AvatarImage src={post.workspace.logo || undefined} />
							<AvatarFallback>
								{(post.workspace.name.charAt(0) || "W").toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<span className="font-medium text-sm">{post.workspace.name}</span>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-screen-md py-14 max-sm:px-4 lg:py-20">
				<div className="mx-auto max-w-screen-md">
					<header className="mb-8">
						<h1 className="mb-4 font-semibold text-4xl leading-tight">
							{post.title}
						</h1>

						<div className="mb-6 border-y py-4">
							{post.authors[0] && (
								<div className="flex items-center gap-2">
									<Avatar className="size-9">
										<AvatarImage src={post.authors[0].image || undefined} />
										<AvatarFallback>
											{(post.authors[0].name.charAt(0) || "A").toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col">
										<span className="text-muted-foreground text-xs">
											{post.authors[0].name}
										</span>
										<span className="text-muted-foreground text-xs">
											{format(post.publishedAt, "MMM d, yyyy")}
										</span>
									</div>
								</div>
							)}
						</div>

						{post.coverImage && (
							<div className="mb-8">
								<Image
									alt={post.title}
									className="w-full object-cover"
									height={400}
									src={post.coverImage}
									width={800}
								/>
							</div>
						)}
					</header>

					<Prose
						className="prose-iframe prose-img:rounded-none"
						html={post.content}
					/>
				</div>
			</main>

			<footer className="border-t bg-muted/30">
				<div className="container mx-auto p-4">
					<p className="text-center text-muted-foreground text-sm">
						This is a shared draft from {post.workspace.name}
					</p>
				</div>
			</footer>
		</div>
	);
}

export default SharePageClient;
