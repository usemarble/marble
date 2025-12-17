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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { cn } from "@marble/ui/lib/utils";
import {
  ArrowArcLeftIcon,
  CheckIcon,
  CircleNotchIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { organization } from "@/lib/auth/client";

type PageClientProps = {
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
};

type GetOrganizationResponse = {
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
};

type InviteStatus = "pending" | "accepted" | "rejected";

function PageClient({ id, user }: PageClientProps) {
  const [invitation, setInvitation] = useState<GetOrganizationResponse | null>(
    null
  );
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await organization.acceptInvitation({
        invitationId: id,
      });

      if (res.error) {
        setError(res.error.message || "Failed to accept invitation");
        return;
      }

      setInviteStatus("accepted");
      router.push(`/${invitation?.organizationSlug}`);
    } catch (error) {
      // Handle unexpected errors (network errors, etc.)
      console.error("Error accepting invitation:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    setError(null);
    try {
      const res = await organization.rejectInvitation({
        invitationId: id,
      });

      if (res.error) {
        setError(res.error.message || "Failed to reject invitation");
        return;
      }

      setInviteStatus("rejected");
    } catch (error) {
      // Handle unexpected errors
      console.error("Error rejecting invitation:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setRejecting(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    organization
      .getInvitation({
        query: {
          id,
        },
      })
      .then((res) => {
        if (res.error) {
          setError(res.error.message || "An error occurred");
        } else {
          setInvitation(res.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching invitation:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load invitation. Please try again."
        );
      });
  }, []);

  return (
    <div className="flex items-center justify-center">
      {invitation ? (
        <Card className="max-w-md rounded-[24px] px-5 py-7">
          <CardHeader
            className={cn(
              "items-center",
              inviteStatus !== "pending" && "sr-only"
            )}
          >
            <CardTitle className="font-medium">Invitation</CardTitle>
            <CardDescription>
              You've been invited to join a workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inviteStatus === "pending" && (
              <div className="mt-5 flex flex-col gap-8">
                <div className="flex items-center justify-center gap-4">
                  <Avatar className="size-14">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>XQ</AvatarFallback>
                  </Avatar>
                  <svg
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>X</title>
                    <path
                      d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <Avatar className="size-14">
                    <AvatarImage src="" />
                    <AvatarFallback>MAB</AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-center text-sm">
                  <strong>{invitation?.inviterEmail}</strong> has invited you to
                  join <strong>{invitation?.organizationName}</strong>.
                </p>
                {/* <p className="text-sm text-center">
                  This invitation was sent to{" "}
                  <strong>{invitation?.email}</strong>.
                </p> */}
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
          </CardContent>
          {error && inviteStatus === "pending" && (
            <div className="mt-4 rounded-sm border border-destructive bg-destructive/10 p-3">
              <p className="text-center text-destructive text-sm">{error}</p>
            </div>
          )}
          {inviteStatus === "pending" && (
            <CardFooter className="mt-4 grid grid-cols-2 gap-6">
              <AsyncButton
                isLoading={rejecting}
                onClick={handleReject}
                variant="outline"
              >
                Reject
              </AsyncButton>
              <AsyncButton
                isLoading={accepting}
                onClick={handleAccept}
                variant="outline"
              >
                Accept
              </AsyncButton>
            </CardFooter>
          )}
        </Card>
      ) : error ? (
        <InviteError />
      ) : (
        <InviteLoading />
      )}
    </div>
  );
}

export default PageClient;

function InviteError() {
  return (
    <Card className="w-full max-w-md rounded-[24px] px-5 py-7">
      <CardHeader className="text-center">
        <CardTitle className="font-medium">Invalid Invite</CardTitle>
        <CardDescription className="sr-only">
          This invite is invalid or you don't have the correct permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
    <Card className="grid h-80 max-w-md place-content-center rounded-[24px] p-6">
      <CardHeader className="sr-only">
        <CardTitle>Loading</CardTitle>
        <CardDescription>
          We're verifying your invite link, please hold on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <CircleNotchIcon className="size-5 animate-spin transition" />
          <p className="max-w-prose text-center text-muted-foreground">
            We're verifying your invite link. This might take a few seconds...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
