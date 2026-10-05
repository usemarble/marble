import type { Metadata } from "next";
import { WorkspaceLanding } from "@/components/auth/workspace-landing";

export const metadata: Metadata = { title: "Marble" };

export default function Page() {
  return <WorkspaceLanding />;
}
