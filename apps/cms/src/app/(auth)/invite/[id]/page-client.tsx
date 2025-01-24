"use client";

import { organization, useSession } from "@/lib/auth/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Button, buttonVariants } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { CheckIcon, Loader2, LoaderIcon, Undo, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [invitation, setInvitation] = useState<GetOrganizationResponse | null>(
    null,
  );
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setAccepting(true);
    await organization
      .acceptInvitation({
        invitationId: id,
      })
      .then((res) => {
        if (res.error) {
          setError(res.error.message || "An error occurred");
        } else {
          setInviteStatus("accepted");
          setAccepting(false);
          router.push(`/${invitation?.organizationSlug}`);
        }
      });
  };

  const handleReject = async () => {
    setRejecting(true);
    await organization
      .rejectInvitation({
        invitationId: id,
      })
      .then((res) => {
        if (res.error) {
          setError(res.error.message || "An error occurred");
        } else {
          setRejecting(false);
          setInviteStatus("rejected");
          // here i should check if the user has a workspace already and redirect to it
          // if they dont i should redirect to the onboarding page or the website landing page
          // depends havent decided yet
        }
      });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    organization
      .getInvitation({
        query: {
          id: id,
        },
      })
      .then((res) => {
        if (res.error) {
          setError(res.error.message || "An error occurred");
        } else {
          setInvitation(res.data);
        }
      });
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      {invitation ? (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Workspace Invitation</CardTitle>
            <CardDescription>
              You've been invited to join a workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inviteStatus === "pending" && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <Avatar className="size-14">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>XQ</AvatarFallback>
                  </Avatar>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                    />
                  </svg>
                  <Avatar className="size-14">
                    <AvatarImage src="https://github.com/taqh.png" />
                    <AvatarFallback>XQ</AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-sm text-center">
                  <strong>{invitation?.inviterEmail}</strong> has invited you to
                  join <strong>{invitation?.organizationName}</strong>.
                </p>
                <p className="text-sm text-center">
                  This invitation was sent to{" "}
                  <strong>{invitation?.email}</strong>.
                </p>
              </div>
            )}
            {inviteStatus === "accepted" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                  <CheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-center">
                  Welcome to {invitation?.organizationName}!
                </h2>
                <p className="text-center">
                  You've successfully joined the organization. We're excited to
                  have you on board!
                </p>
              </div>
            )}
            {inviteStatus === "rejected" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
                  <XIcon className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-center">
                  Invitation Declined
                </h2>
                <p className="text-center">
                  You&lsquo;ve declined the invitation to join{" "}
                  {invitation?.organizationName}.
                </p>
              </div>
            )}
          </CardContent>
          {inviteStatus === "pending" && (
            <CardFooter className="grid gap-6 grid-cols-2 mt-4">
              <Button
                disabled={rejecting}
                variant="outline"
                onClick={handleReject}
              >
                {rejecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Reject"
                )}
              </Button>
              <Button disabled={accepting} onClick={handleAccept}>
                {accepting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Accept"
                )}
              </Button>
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
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Invalid Invite</CardTitle>
        <CardDescription className="sr-only">
          This invite is invalid or you don't have the correct permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          <p className="text-muted-foreground text-center">
            The invitation you're trying to access is either invalid or you
            don't have the correct permissions. Please check your email for a
            valid invitation or contact the person who sent it.
          </p>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "gap-2 items-center flex",
            })}
          >
            <Undo className="size-4" />
            <span>Back home</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function InviteLoading() {
  return (
    <div className="bg-white p-6 rounded-lg min-h-96 min-w-40 grid place-content-center">
      <div className="flex flex-col items-center gap-4">
        <LoaderIcon className="size-5 animate-spin transition text-muted-foreground" />
        <p className="text-muted-foreground max-w-prose text-center">
          We're verifying your invite link. This might take a few seconds...
        </p>
      </div>
    </div>
  );
}
