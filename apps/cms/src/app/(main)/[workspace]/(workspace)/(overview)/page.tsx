import PageClient from "./page-client";

export const metadata = {
  title: "Overview",
  description: "Workspace overview and metrics",
};

async function Page() {
  return <PageClient />;
}

export default Page;
