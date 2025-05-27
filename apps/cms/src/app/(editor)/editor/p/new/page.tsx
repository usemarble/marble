import type { Metadata } from "next";
import NewPostPageClient from "./page-client";

export const metadata: Metadata = {
  title: "New post - Marble",
};

export default function Page() {
  return <NewPostPageClient />;
}
