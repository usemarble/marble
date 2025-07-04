import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Team",
  description: "Manage your team members",
};

async function Page() {
  return <PageClient />;
}

export default Page;
