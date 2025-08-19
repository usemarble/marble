import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/auth/reset/reset-form";
import ResetRequestForm from "@/components/auth/reset/reset-request-form";
import PageLoader from "@/components/shared/page-loader";

export const metadata: Metadata = {
  title: "Reset Password",
};

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ResetPage({ searchParams }: PageProps) {
  const token = searchParams.token as string | undefined;

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
