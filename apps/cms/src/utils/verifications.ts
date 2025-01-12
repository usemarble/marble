import getServerSession from "@/lib/auth/session";
import db from "@repo/db";
import { redirect } from "next/navigation";

export const redirectIfLoggedIn = async () => {
  const session = await getServerSession();
  if (!session) return redirect("/login");

  // First try to find a workspace where user is owner
  const ownerWorkspace = await db.organization.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id,
          role: "OWNER"
        }
      }
    },
    select: { slug: true },
  });

  if (ownerWorkspace) {
    return redirect(`/${ownerWorkspace.slug}`);
  }

  // If no owner workspace, check for any workspace user is a member of
  const memberWorkspace = await db.organization.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id
        }
      }
    },
    select: { slug: true },
  });

  if (memberWorkspace) {
    return redirect(`/${memberWorkspace.slug}`);
  }

  // If no workspace at all, redirect to onboarding
  return redirect("/onboarding");
};
