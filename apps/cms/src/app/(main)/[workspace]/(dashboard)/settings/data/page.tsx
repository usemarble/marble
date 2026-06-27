import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Data",
  description: "Import and export your workspace data",
};

async function Page() {
  return <PageClient />;
}

export default Page;
