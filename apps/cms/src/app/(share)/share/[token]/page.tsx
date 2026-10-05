import type { Metadata } from "next";
import SharePageClient from "./page-client";

export const metadata: Metadata = {
  title: "Shared Post",
  description: "View a shared draft post",
};

export default function SharePage() {
  return <SharePageClient />;
}
