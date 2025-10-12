import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Editor Preferences",
  description: "Manage your workspace editor preferences",
};

function Page() {
  return <PageClient />;
}

export default Page;
