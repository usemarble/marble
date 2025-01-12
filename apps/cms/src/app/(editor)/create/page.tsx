import getServerSession from "@/lib/auth/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";
import PageContent from "./page-content";

export const metadata: Metadata = {
  title: "Editor",
};

async function Page() {
  const session = getServerSession();
  if (!session) return redirect("/login");
  return <PageContent />;
}

export default Page;
