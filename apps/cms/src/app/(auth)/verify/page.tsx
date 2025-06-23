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
  const from = s.from as string;
  const email = s.email as string;

  return (
    <div>
      <Suspense fallback={<PageLoader />}>
        <VerifyForm email={email} callbackUrl={from} />
      </Suspense>
    </div>
  );
}
