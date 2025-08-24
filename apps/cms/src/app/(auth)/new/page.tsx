import type { Metadata } from "next";
import { Suspense } from "react";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "New workspace",
};

async function Page() {
  return (
    <Suspense>
      <PageClient />
    </Suspense>
  );
}

export default Page;
