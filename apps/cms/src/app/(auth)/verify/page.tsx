import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyForm } from "@/components/auth/verify-form";
import PageLoader from "@/components/shared/page-loader";

export const metadata: Metadata = {
  title: "Verify Email",
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const s = await searchParams;
  const from = (s.from as string) ?? "/";
  const rawEmail = s.email as string;

  const email = rawEmail ? decodeURIComponent(rawEmail) : "";

  return (
    <div>
      <Suspense fallback={<PageLoader />}>
        <VerifyForm email={email} callbackUrl={from} />
      </Suspense>
    </div>
  );
}
