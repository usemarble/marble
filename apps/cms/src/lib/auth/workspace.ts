import { auth } from "@/lib/auth";
import type { Organization } from "@repo/db/client";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import getServerSession from "./session";
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