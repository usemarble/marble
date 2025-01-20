import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { authClient } from "./client";

export async function setActiveWorkspace(slug: string) {
  auth.api.setActiveOrganization({
    headers: await headers(),
    body: {
      organizationSlug: slug,
    },
  });
}

export async function setClientActiveWorkspace(slug: string) {
  await authClient.organization.setActive({
    organizationSlug: slug,
  });
}
