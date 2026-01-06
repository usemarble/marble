import { Link02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogX,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { TimerIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { differenceInHours, differenceInMinutes, isBefore } from "date-fns";
import { useState } from "react";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { usePlan } from "@/hooks/use-plan";
import { AsyncButton } from "../ui/async-button";
import { CopyButton } from "../ui/copy-button";

interface ShareModalProps {
  postId: string;
}

export function ShareModal({ postId }: ShareModalProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { isHobbyPlan } = usePlan();
  const isFreePlan = isHobbyPlan;

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
    <>
      <Dialog>
        <DialogTrigger
          render={
            <Button
              aria-label="Share draft link"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <HugeiconsIcon icon={Link02Icon} />
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md" variant="card">
          <DialogHeader className="flex-row items-center justify-between px-4 py-2">
            <div className="flex flex-1 items-center gap-2">
              <HugeiconsIcon
                className="text-muted-foreground"
                icon={Link02Icon}
                size={18}
                strokeWidth={2}
              />
              <DialogTitle className="font-medium text-muted-foreground text-sm">
                Share Draft link
              </DialogTitle>
            </div>
            <DialogX />
          </DialogHeader>
          <DialogDescription className="sr-only">
            Anyone with this link will be able to view your draft.
          </DialogDescription>
          <DialogBody>
            {isFreePlan ? (
              <>
                <div className="flex flex-col gap-2 py-4">
                  <p className="">
                    Upgrade to Pro to share drafts with others.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    You can try it free for 7 days.
                  </p>
                </div>
                <DialogFooter>
                  <DialogClose size="sm">Close</DialogClose>
                  <Button onClick={() => setShowUpgradeModal(true)} size="sm">
                    Upgrade
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
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
                      <TimerIcon className="size-2.5" />{" "}
                      {formatExpiration(expiresAt)}
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
              <Label htmlFor="expire">
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
                <DialogFooter>
                  <DialogClose size="sm">Close</DialogClose>
                  <AsyncButton
                    disabled={isPending}
                    isLoading={isPending}
                    onClick={() => generateShareLink()}
                    size="sm"
                    type="button"
                  >
                    Generate
                  </AsyncButton>
                </DialogFooter>
              </>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
