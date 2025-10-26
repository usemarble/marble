import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Team Members",
  description: "Manage your team members and invites",
};

async function Page() {
  return <PageClient />;
}

export default Page;
