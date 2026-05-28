import { Skeleton } from "@marble/ui/components/skeleton";
import { DashboardBody } from "@/components/layout/wrapper";

const skeletonRows = [
  "row-1",
  "row-2",
  "row-3",
  "row-4",
  "row-5",
  "row-6",
  "row-7",
  "row-8",
];

export default function Loading() {
  return (
    <DashboardBody className="flex flex-col gap-6 pt-10 pb-16" size="compact">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="rounded-lg border">
        <div className="grid grid-cols-4 gap-4 border-b p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        {skeletonRows.map((row) => (
          <div className="grid grid-cols-4 gap-4 border-b p-4" key={row}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-10" />
          </div>
        ))}
      </div>
    </DashboardBody>
  );
}
