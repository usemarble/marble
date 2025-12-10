import PageClient from "./page-client";

export const metadata = {
  title: "Home",
  description: "Workspace overview and metrics",
};

async function Page() {
  return <PageClient />;
}

export default Page;
