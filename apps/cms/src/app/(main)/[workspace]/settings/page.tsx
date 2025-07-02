import { redirect } from "next/navigation";

async function Page() {
  return redirect("/settings/general");
}

export default Page;
