import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "General",
  description: "Manage your workspace general settings",
};

async function Page() {
  return <PageClient />;
}

export default Page;
