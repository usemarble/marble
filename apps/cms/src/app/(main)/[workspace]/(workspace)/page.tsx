import { redirect } from "next/navigation";
import getServerSession from "@/lib/auth/session";
import PageClient from "./page-client";

async function Page() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <PageClient session={session} />;
}

export default Page;
