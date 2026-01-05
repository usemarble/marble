import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Appearance",
  description: "Customize how Marble looks for you",
};

async function Page() {
  return <PageClient />;
}

export default Page;
