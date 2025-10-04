import { redirect } from "next/navigation";
import { Suspense } from "react";
import PageLoader from "@/components/shared/page-loader";
import { getServerSession } from "@/lib/auth/session";
import PageClient from "./page-client";

export default async function InvitePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;

  return (
    <div className="grid h-screen w-full place-content-center bg-muted">
      <Suspense fallback={<PageLoader />}>
        <InvitePageComponent code={id} />
      </Suspense>
    </div>
  );
}

async function InvitePageComponent({ code }: { code: string }) {
  const session = await getServerSession();

  if (!session || !session.user) {
    return redirect(`/login/?from=/join/${code}`);
  }

  return <PageClient id={code} user={session.user} />;
}
