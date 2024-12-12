import getSession from "@/lib/auth/get-session";
import { redirect } from "next/navigation";

export const redirectIfLoggedIn = async () => {
  const session = await getSession();
  if (!session) return redirect("/app");
};
