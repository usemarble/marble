import { PageClient } from "./page-client";

export const metadata = {
  title: "Webhooks",
  description: "Create webhooks to receive events from your workspace.",
};

async function Page() {
  return <PageClient />;
}

export default Page;
