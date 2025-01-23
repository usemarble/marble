import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Onboarding",
};

async function Page() {
  return (
    <div className="h-screen grid place-items-center">
      <PageClient />
    </div>
  );
}

export default Page;
