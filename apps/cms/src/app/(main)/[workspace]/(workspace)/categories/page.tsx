import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import PageLoader from "@/components/shared/page-loader";
import PageClient from "./page-client";

export const metadata = {
  title: "Categories",
  description: "Manage your categories",
};

function ErrorFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-red-600">
          Something went wrong
        </h2>
        <p className="text-muted-foreground text-sm">
          Failed to load categories
        </p>
      </div>
    </div>
  );
}

function Page() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<PageLoader />}>
        <PageClient />
      </Suspense>
    </ErrorBoundary>
  );
}

export default Page;
