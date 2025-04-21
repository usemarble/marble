import { auth } from "@/lib/auth/auth";
import type { Metadata } from "next";
import { headers } from "next/headers";
import React from "react";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Team",
  description: "Manage your team members",
};

async function Page({ params }: { params: Promise<{ workspace: string }> }) {
  const [session, organization] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    auth.api.getFullOrganization({
      headers: await headers(),
    }),
  ]);

  return <PageClient activeOrganization={organization} session={session} />;
}

export default Page;
