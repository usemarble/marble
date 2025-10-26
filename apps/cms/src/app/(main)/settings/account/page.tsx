import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your account settings",
};

export default async function AccountSettingsPage() {
  return <PageClient />;
}
