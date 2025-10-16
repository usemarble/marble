import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Authors",
  description: "Manage your authors",
};

async function Page() {
  return <PageClient />;
}

export default Page;
