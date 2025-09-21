import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { LinkSimpleIcon, ShareFatIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AsyncButton } from "../ui/async-button";
import { CopyButton } from "../ui/copy-button";

interface ShareModalProps {
  postId: string;
}

export function ShareModal({ postId }: ShareModalProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const { mutate: generateShareLink, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate share link");
      }

      const data = await res.json();
      setShareLink(data.shareLink);
      setExpiresAt(new Date(data.expiresAt));
      return data;
    },
    onSuccess: () => {
      toast.success("Link generated successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate share link"
      );
    },
  });

  const formatExpiration = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Expires in less than an hour";
    }
    if (diffInHours === 1) {
      return "Expires in 1 hour";
    }
    return `Expires in ${diffInHours} hours`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" type="button" variant="ghost">
          <LinkSimpleIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>
            Anyone with this link will be able to view your draft.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          <div className="flex w-full items-center gap-2">
            <Label className="sr-only" htmlFor="link">
              Link
            </Label>
            {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
            <Input
              id="link"
              placeholder="your share link will appear here"
              readOnly
              value={shareLink || ""}
            />
            <CopyButton
              className="shadow-none"
              disabled={!shareLink}
              textToCopy={shareLink || ""}
              toastMessage="Link copied to clipboard."
            />
          </div>
          {expiresAt && (
            <p className="text-[11px] text-muted-foreground">
              {formatExpiration(expiresAt)}.
            </p>
          )}
          {!shareLink && (
            <p className="text-[11px] text-muted-foreground">
              Links automatically expire after 24 hours.
            </p>
          )}
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <AsyncButton
            disabled={isPending}
            isLoading={isPending}
            onClick={() => generateShareLink()}
            type="button"
          >
            Generate
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
