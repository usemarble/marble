"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Button } from "@marble/ui/components/button";
import { ClockIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import Prose from "@/components/share/prose";
import { LinkExpired, LinkNotFound } from "@/components/share/screens";
import type { ShareData } from "@/types/share";

interface SharePageClientProps {
  token?: string;
  data?: ShareData;
  status?: "expired" | "not-found";
}

function SharePageClient({ data, status }: SharePageClientProps) {
  const { theme } = useTheme();
  if (status === "expired") {
    return <LinkExpired />;
  }

  if (!data) {
    return <LinkNotFound />;
  }

  const { post, expiresAt } = data;
  const expirationDate = new Date(expiresAt);
  const isExpiringSoon =
    expirationDate.getTime() - Date.now() < 2 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage
                src={theme === "dark" ? "/icon-light.svg" : "/icon.svg"}
              />
              <AvatarFallback>
                {post.workspace.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <svg
              className="size-4 text-muted-foreground"
              height="16"
              strokeLinejoin="round"
              viewBox="0 0 16 16"
              width="16"
            >
              <path
                clipRule="evenodd"
                d="M4.01526 15.3939L4.3107 14.7046L10.3107 0.704556L10.6061 0.0151978L11.9849 0.606077L11.6894 1.29544L5.68942 15.2954L5.39398 15.9848L4.01526 15.3939Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={post.workspace.logo || undefined} />
                <AvatarFallback>
                  {post.workspace.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{post.workspace.name}</span>
            </div>
            <svg
              className="size-4 fill-accent-foreground"
              height="16"
              strokeLinejoin="round"
              viewBox="0 0 16 16"
              width="16"
            >
              <path
                clipRule="evenodd"
                d="M4.01526 15.3939L4.3107 14.7046L10.3107 0.704556L10.6061 0.0151978L11.9849 0.606077L11.6894 1.29544L5.68942 15.2954L5.39398 15.9848L4.01526 15.3939Z"
                fillRule="evenodd"
                // fill="currentColor"
              />
            </svg>
            <p className="text-muted-foreground text-sm">{post.title}</p>
          </div>
          <Button size="sm" variant="outline">
            <Link href={`/share/${post.workspace.slug}/${post.id}`}>
              View on website
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="mb-4 font-bold text-4xl leading-tight">
              {post.title}
            </h1>
            <p className="mb-6 text-muted-foreground text-xl">
              {post.description}
            </p>

            {/* Authors */}
            <div className="mb-6 flex items-center space-x-4">
              <div className="-space-x-2 flex">
                {post.authors.map((author) => (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted"
                    key={author.id}
                  >
                    {author.image ? (
                      <Image
                        alt={author.name}
                        className="h-10 w-10 rounded-full object-cover"
                        height={40}
                        src={author.image}
                        width={40}
                      />
                    ) : (
                      <span className="font-medium text-sm">
                        {author.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {post.authors.map((author) => author.name).join(", ")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {post.category.name}
                </p>
              </div>
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="mb-8">
                <Image
                  alt={post.title}
                  className="w-full rounded-lg object-cover"
                  height={400}
                  src={post.coverImage}
                  width={800}
                />
              </div>
            )}

            {isExpiringSoon && (
              <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <p className="text-orange-800 text-sm dark:text-orange-200">
                    This link expires soon. Please save any important
                    information.
                  </p>
                </div>
              </div>
            )}
          </header>

          <Prose html={post.content} />
        </div>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <p>This is a shared draft from {post.workspace.name}</p>
            <p>Link expires {expirationDate.toLocaleDateString()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SharePageClient;
