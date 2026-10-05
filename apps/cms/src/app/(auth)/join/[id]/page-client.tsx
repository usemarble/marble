"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { buttonVariants } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { cn } from "@marble/ui/lib/utils";
import {
  ArrowArcLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleNotchIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { organization } from "@/lib/auth/client";

interface PageClientProps {
  id: string;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null | undefined | undefined;
  };
}

interface GetOrganizationResponse {
  organizationName: string;
  organizationSlug: string;
  inviterEmail: string;
  id: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  email: string;
  expiresAt: Date;
  organizationId: string;
  role: string;
  inviterId: string;
}

type InviteStatus = "pending" | "accepted" | "rejected";

function PageClient({ id, user }: PageClientProps) {
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("pending");
  const [actionError, setActionError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const router = useRouter();

  const {
    data: invitation,
    error: fetchError,
    isLoading,
  } = useQuery({
    queryKey: ["invitation", id],
    queryFn: async () => {
      const res = await organization.getInvitation({ query: { id } });
      if (res.error) {
        throw new Error(res.error.message || "An error occurred");
      }
      return res.data as GetOrganizationResponse;
    },
  });

  const error = actionError || fetchError?.message || null;

  const handleAccept = async () => {
    setAccepting(true);
    setActionError(null);
    try {
      const res = await organization.acceptInvitation({
        invitationId: id,
      });

      if (res.error) {
        setActionError(res.error.message || "Failed to accept invitation");
      } else {
        setInviteStatus("accepted");
        router.push(`/${invitation?.organizationSlug}`);
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    }
    setAccepting(false);
  };

  const handleReject = async () => {
    setRejecting(true);
    setActionError(null);
    try {
      const res = await organization.rejectInvitation({
        invitationId: id,
      });

      if (res.error) {
        setActionError(res.error.message || "Failed to reject invitation");
      } else {
        setInviteStatus("rejected");
      }
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    }
    setRejecting(false);
  };

  return (
    <div className="flex w-full items-center justify-center px-4 py-12">
      {invitation ? (
        <Card className="w-full max-w-md gap-4 rounded-[20px] border-none bg-surface p-2">
          <CardHeader
            className={cn(
              "gap-0 px-4 pt-4",
              inviteStatus !== "pending" && "sr-only"
            )}
          >
            <CardTitle className="font-medium text-lg">
              Workspace invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="rounded-[12px] bg-background p-4 shadow-xs">
            {inviteStatus === "pending" && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-center gap-4">
                  <Avatar className="size-14">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase() ||
                        user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                  <Avatar className="size-14">
                    <AvatarFallback className="bg-primary/10 font-medium text-primary">
                      {invitation.organizationName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-center text-muted-foreground text-sm leading-relaxed">
                  <strong className="break-all font-medium text-foreground">
                    {invitation.inviterEmail}
                  </strong>{" "}
                  has invited you to join{" "}
                  <strong className="font-medium text-foreground">
                    {invitation.organizationName}
                  </strong>
                  .
                </p>
              </div>
            )}
            {inviteStatus === "accepted" && (
              <div className="space-y-4 pt-8 pb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckIcon className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-center font-medium text-2xl">
                  Welcome to {invitation?.organizationName}!
                </h2>
                <p className="text-center">
                  We're excited to have you on board!
                </p>
              </div>
            )}
            {inviteStatus === "rejected" && (
              <div className="space-y-4 pt-8 pb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <XIcon className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-center font-medium text-2xl">Declined</h2>
                <p className="text-center text-muted-foreground">
                  You&lsquo;ve declined the invitation to join{" "}
                  {invitation?.organizationName}.
                </p>
                <div className="flex items-center justify-center">
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      className: "flex items-center gap-2",
                    })}
                    href="/"
                  >
                    <ArrowArcLeftIcon className="size-4" />
                    <span>Back home</span>
                  </Link>
                </div>
              </div>
            )}
            {error && inviteStatus === "pending" && (
              <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <ErrorMessage className="text-center text-sm">
                  {error}
                </ErrorMessage>
              </div>
            )}
            {inviteStatus === "pending" && (
              <div className="mt-10 grid grid-cols-2 gap-3">
                <AsyncButton
                  disabled={accepting || rejecting}
                  isLoading={rejecting}
                  onClick={handleReject}
                  variant="destructive"
                >
                  Reject
                </AsyncButton>
                <AsyncButton
                  disabled={accepting || rejecting}
                  isLoading={accepting}
                  onClick={handleAccept}
                  variant="default"
                >
                  Accept
                </AsyncButton>
              </div>
            )}
          </CardContent>
        </Card>
      ) : error && !isLoading ? (
        <InviteError />
      ) : isLoading ? (
        <InviteLoading />
      ) : null}
    </div>
  );
}

export default PageClient;

function InviteError() {
  return (
    <Card className="w-full max-w-md gap-4 rounded-[20px] border-none bg-surface p-2.5">
      <CardHeader className="gap-2 px-4 pt-4 pb-1">
        <CardTitle className="font-medium">Invalid Invite</CardTitle>
        <CardDescription className="sr-only">
          This invite is invalid or you don't have the correct permissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="rounded-[12px] bg-background p-6 shadow-xs">
        <div className="flex flex-col items-center gap-6">
          <p className="text-center text-muted-foreground">
            The invitation you're trying to access is either invalid or you
            don't have the correct permissions. Please check your email for a
            valid invitation or contact the sender.
          </p>
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "flex items-center gap-2",
            })}
            href="/"
          >
            <ArrowArcLeftIcon className="size-4 text-muted-foreground" />
            <span>Back home</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function InviteLoading() {
  return (
    <Card className="w-full max-w-md gap-0 rounded-[20px] border-none bg-surface p-2.5">
      <CardHeader className="sr-only">
        <CardTitle>Loading</CardTitle>
        <CardDescription>
          We're verifying your invite link, please hold on.
        </CardDescription>
      </CardHeader>
      <CardContent className="rounded-[12px] bg-background p-6 shadow-xs">
        <div className="flex min-h-60 flex-col items-center justify-center gap-4">
          <CircleNotchIcon className="size-5 animate-spin transition" />
          <p className="max-w-prose text-center text-muted-foreground">
            We're verifying your invite link. This might take a few seconds...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
