import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your account settings",
};

async function Page() {
  return <PageClient />;
}

export default Page;
