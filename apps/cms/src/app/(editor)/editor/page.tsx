import React from "react";
import PageContent from "./page-content";
import { Metadata } from "next";
import getSession from "@/lib/auth/get-session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Editor",
};

async function Page() {
  const session = getSession();
  if (!session) return redirect("/login");
  return <PageContent />;
}

export default Page;
