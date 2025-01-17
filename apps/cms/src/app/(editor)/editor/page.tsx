import getServerSession from "@/lib/auth/session";
import { redirect } from "next/navigation";
import React from "react";
import PageClient from "./page-client"

async function Page() {
  const session = getServerSession();
  if (!session) return redirect("/login");
  return <PageClient />;
}

export default Page;
