import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/auth/reset/reset-form";
import ResetRequestForm from "@/components/auth/reset/reset-request-form";
import PageLoader from "@/components/shared/page-loader";

export const metadata: Metadata = {
  title: "Reset Password",
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ResetPage({ searchParams }: PageProps) {
  let token = (await searchParams).token;

  if (Array.isArray(token)) {
    token = token[0];
  }

  // If token exists, show ResetForm
  if (token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Suspense fallback={<PageLoader />}>
          <ResetForm callbackUrl="/login" token={token} />
        </Suspense>
      </main>
    );
  }

  // Otherwise show ResetRequestForm
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<PageLoader />}>
        <ResetRequestForm />
      </Suspense>
    </main>
  );
}
