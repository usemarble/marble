import PageLoader from "@/components/shared/page-loader";
import { acceptInvite, verifyInvite } from "@/lib/actions/invite";
import getSession from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function InvitePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;

  return (
    <div className="h-screen w-full grid place-content-center">
      <Suspense fallback={<PageLoader />}>
        <InvitePageComponent code={id} />
      </Suspense>
    </div>
  );
}

async function InvitePageComponent({ code }: { code: string }) {
  const session = await getSession();

  if (!session || !session.user) {
    redirect(`/login/?from=/invite/${code}`);
  }

  const invite = await verifyInvite(code);

  if (!invite) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Invalid Invite</h1>
          <p className="text-muted-foreground">
            This invite link is no longer valid or has expired.
          </p>
        </div>
      </div>
    );
  }

  if (session.user.email === invite.email) {
    try {
      const workspace = await acceptInvite(code);
      redirect(`/${workspace.id}`);
    } catch (error) {
      return (
        <div className="mx-auto max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Error</h1>
            <p className="text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Failed to accept invite"}
            </p>
          </div>
        </div>
      );
    }
  } else {
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Wrong Account</h1>
        <p className="text-muted-foreground">
          This invite is for {invite.email}. Please sign in with that email
          address.
        </p>
      </div>
    </div>;
  }
}
