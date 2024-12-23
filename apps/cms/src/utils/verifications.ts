import getSession from "@/lib/auth/session";
import db from "@repo/db";
import { redirect } from "next/navigation";

export const redirectIfLoggedIn = async () => {
  const session = await getSession();
  if (!session) return redirect("/login");

  // This is faulty because what happens if the user is an invited user and they dont have a workspace?

  const workspaceSlug = await db.workspace.findFirst({
    where: {
      ownerId: session?.user?.id,
    },
    select: { slug: true },
  });
  return redirect(`/${workspaceSlug?.slug}`);
};
