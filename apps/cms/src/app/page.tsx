import { redirectIfLoggedIn } from "@/utils/verifications";

async function Page() {
  return await redirectIfLoggedIn();
}

export default Page;
