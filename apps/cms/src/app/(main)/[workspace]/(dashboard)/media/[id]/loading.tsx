import { Skeleton } from "@marble/ui/components/skeleton";
import { DashboardBody } from "@/components/layout/wrapper";

export default function Loading() {
  return (
    <DashboardBody showHeader={false}>
      <div className="flex h-12 items-center justify-between border-b px-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid min-h-[calc(100vh-104px)] place-items-center p-8">
        <Skeleton className="h-96 w-full max-w-3xl rounded-lg" />
      </div>
    </DashboardBody>
  );
}
