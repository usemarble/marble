import type { Metadata } from "next";
import { Suspense } from "react";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Create new workspace",
};

async function Page() {
  return (
    <Suspense>
      <PageClient />
    </Suspense>
  );
}

export default Page;
