import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { authClient } from "./client";

/**
 * Sets the active workspace on the **server** side.
 *
 * This updates the user's server session to mark the given workspace slug
 * as the currently active organization. Should only be called in
 * **server components** or server-side functions.
 *
 * @param slug - The slug of the workspace to set as active.
 */
export async function setActiveWorkspace(slug: string) {
  auth.api.setActiveOrganization({
    headers: await headers(),
    body: {
      organizationSlug: slug,
    },
  });
}

/**
 * Sets the active workspace on the **client** side.
 *
 * This updates the active organization in the user's client-side auth context.
 * Typically called from client components (e.g. workspace switchers)
 * after a user changes their active workspace in the UI.
 *
 * @param slug - The slug of the workspace to set as active.
 */
export async function setClientActiveWorkspace(slug: string) {
  await authClient.organization.setActive({
    organizationSlug: slug,
  });
}
