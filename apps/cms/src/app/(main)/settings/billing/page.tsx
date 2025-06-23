import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Billing Settings",
  description: "Billing settings for your account",
};

function Page() {
  return <PageClient />;
}

export default Page;
