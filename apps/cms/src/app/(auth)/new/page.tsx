import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "New workspace",
};

async function Page() {
  return (
    <div className="h-screen grid place-items-center bg-muted">
      <PageClient />
    </div>
  );
}

export default Page;
