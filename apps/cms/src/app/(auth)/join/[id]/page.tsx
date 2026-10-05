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
    <div className="flex min-h-dvh w-full items-center justify-center bg-background">
      <Suspense fallback={<PageLoader />}>
        <InvitePageComponent code={id} />
      </Suspense>
    </div>
  );
}

async function InvitePageComponent({ code }: { code: string }) {
  const session = await getServerSession();

  if (!session?.user) {
    return redirect(`/login/?from=/join/${code}`);
  }

  return <PageClient id={code} user={session.user} />;
}
