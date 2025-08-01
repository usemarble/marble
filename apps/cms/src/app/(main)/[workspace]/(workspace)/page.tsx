import PageClient from "./page-client";

// const fetchWorkspaceData = async (slug: string) => {
//   try {
//     const response = await request<Workspace>(`workspaces/${slug}`);
//     if (response.status === 200) {
//       // setActiveWorkspace(response.data);
//     }
//     if (response.status === 404) {
//       throw new Error("Workspace not found");
//     }
//     return response.data;
//   } catch (error) {
//     console.error("Failed to fetch workspace data:", error);
//     return null;
//   }
// };

async function Page() {
  return <PageClient />;
}

export default Page;
