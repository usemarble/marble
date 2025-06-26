import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Upgrade Plan",
  description: "Upgrade your plan to get more features",
};

function Page() {
  return <PageClient />;
}

export default Page;
