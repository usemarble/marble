import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import { Checkbox } from "@marble/ui/components/checkbox";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Separator } from "@marble/ui/components/separator";
import { toast } from "@marble/ui/components/sonner";
import {
  CalendarDotsIcon,
  CaretDownIcon,
  LinkSimpleIcon,
  TimerIcon,
} from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { differenceInHours, differenceInMinutes, isBefore } from "date-fns";
import { useState } from "react";
import { AsyncButton } from "../ui/async-button";
import { CopyButton } from "../ui/copy-button";

type ShareModalProps = {
  postId: string;
};

export function ShareModal({ postId }: ShareModalProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showExpiry, setShowExpiry] = useState(false);

  const { mutate: generateShareLink, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, expiresAt: date }),
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

  // Show "Expired" if in the past, "Expires in X hours" if > 1 hour, "Expires in X minutes" if < 1 hour, and "Expires in less than a minute" if < 1 minute
  const formatExpiration = (date: Date) => {
    const now = new Date();
    if (isBefore(date, now)) {
      return "Expired";
    }
    const hours = differenceInHours(date, now);
    if (hours >= 1) {
      return `Expires in ${hours} hour${hours === 1 ? "" : "s"}`;
    }
    const minutes = differenceInMinutes(date, now);
    if (minutes >= 1) {
      return `Expires in ${minutes} minute${minutes === 1 ? "" : "s"}`;
    }
    return "Expires in less than a minute";
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
        <div className="flex flex-col gap-3">
          <div className="flex w-full items-center gap-2">
            <Label className="sr-only" htmlFor="link">
              Link
            </Label>
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
            <Badge variant="pending">
              <TimerIcon className="size-2.5" /> {formatExpiration(expiresAt)}
            </Badge>
          )}
          {/* {expiresAt && (
            <p className="text-[11px] text-muted-foreground">
              {formatExpiration(expiresAt)}.
            </p>
          )}
          {!shareLink && (
            <p className="text-[11px] text-muted-foreground">
              Links automatically expire after 24 hours.
            </p>
          )} */}
          {/* <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showExpiry}
                id="expire"
                onCheckedChange={() => setShowExpiry((prev) => !prev)}
              />
              <Label className="" htmlFor="expire">
                Set expiry
              </Label>
            </div>
            <Badge variant="pending">
              {" "}
              <TimerIcon className="size-2.5" /> in 24 hours
            </Badge>
          </div>
          {showExpiry && (
            <div className="grid gap-4">
              <div className="flex flex-col gap-3">
                <Label className="px-1" htmlFor="date-picker">
                  Date
                </Label>
                <Popover onOpenChange={setOpen} open={open}>
                  <PopoverTrigger asChild>
                    <Button
                      className="justify-between font-normal shadow-none"
                      id="date-picker"
                      variant="outline"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarDotsIcon className="size-4" />
                        <span>
                          {date ? format(date, "MMM d, yyyy") : "Select date"}
                        </span>
                      </div>
                      <CaretDownIcon className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-auto overflow-hidden p-0"
                  >
                    <Calendar
                      captionLayout="dropdown"
                      defaultMonth={date}
                      mode="single"
                      onSelect={(date) => {
                        setDate(date);
                        setOpen(false);
                      }}
                      selected={date}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )} */}
        </div>
        <DialogFooter className="">
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
