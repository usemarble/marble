"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { format } from "date-fns";
import Image from "next/image";
import { useTheme } from "next-themes";
import Prose from "@/components/share/prose";
import { LinkExpired, LinkNotFound } from "@/components/share/screens";
import type { ShareData } from "@/types/share";

type SharePageClientProps = {
  token?: string;
  data?: ShareData;
  status?: "expired" | "not-found";
};

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

  const formatExpiration = (date: Date) => {
    return format(date, "MMM d, yyyy");
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            {/* <Avatar>
              <AvatarImage
                src={theme === "dark" ? "/icon-light.svg" : "/icon.svg"}
              />
              <AvatarFallback>
                {post.workspace.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-sm">/</span> */}
            <div className="flex items-center gap-2">
              <Avatar className="size-8 border border-dashed">
                <AvatarImage src={post.workspace.logo || undefined} />
                <AvatarFallback>
                  {post.workspace.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{post.workspace.name}</span>
            </div>
            <span className="text-muted-foreground text-sm">/</span>
            <p className="text-muted-foreground text-sm">{post.title}</p>
          </div>
        </div>
      </header>

      <div className="relative grid grid-cols-[500px_1fr]">
        <aside className="sticky top-0">
          <div className="container mx-auto px-4 py-8">
            <p className="text-muted-foreground text-sm">
              This is a shared draft from {post.workspace.name}
            </p>
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
          </div>
        </aside>
        <main className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <header className="mb-8">
              <h1 className="mb-4 font-bold text-4xl leading-tight">
                {post.title}
              </h1>
              <p className="mb-6 text-muted-foreground text-xl">
                {post.description}
              </p>

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
            </header>

            <Prose html={post.content} />
          </div>
        </main>
      </div>

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
