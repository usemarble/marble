import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your workspace billing settings",
};

async function Page() {
  return <PageClient />;
}

export default Page;
