import { PageClient } from "./page-client";

export const metadata = {
  title: "Custom Fields",
  description: "Define custom fields to extend your post schema.",
};

async function Page() {
  return <PageClient />;
}

export default Page;
