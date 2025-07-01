import { db } from "@marble/db";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import getServerSession from "@/lib/auth/session";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your account settings",
};

export default async function AccountSettingsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const userAccountDetails = await db.account.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      createdAt: true,
      providerId: true,
      accountId: true,
      user: {
        select: {
          email: true,
          name: true,
          id: true,
        },
      },
    },
  });

  const accountDetails = userAccountDetails.map((account) => ({
    id: account.id,
    createdAt: account.createdAt,
    providerId: account.providerId,
    accountId: account.accountId,
    email: account.user.email,
    userId: account.user.id,
  }));

  const userDetails = {
    name: session.user.name,
    email: session.user.email,
    id: session.user.id,
    image: session.user.image,
  };

  console.log(userAccountDetails);

  return (
    <PageClient accountDetails={accountDetails} userDetails={userDetails} />
  );
}
