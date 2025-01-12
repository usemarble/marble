import getServerSession from "@/lib/auth/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Onboarding",
};

async function Page() {
  const session = await getServerSession();
  if (!session) {
    return redirect("/login");
  }

  return (
    <div className="h-screen grid place-items-center">
      <PageClient />
    </div>
  );
}

export default Page;
