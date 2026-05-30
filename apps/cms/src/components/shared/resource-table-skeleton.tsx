import { Skeleton } from "@marble/ui/components/skeleton";
import { DashboardBody } from "@/components/layout/wrapper";

const rows = [
  "row-1",
  "row-2",
  "row-3",
  "row-4",
  "row-5",
  "row-6",
  "row-7",
  "row-8",
];

export function ResourceTableSkeleton() {
  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <div>
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-9 w-full sm:w-72" />
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="rounded-md border">
          <div className="flex items-center gap-4 border-b p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
          {rows.map((row) => (
            <div
              className="flex items-center gap-4 border-b p-4 last:border-0"
              key={row}
            >
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto size-7 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </DashboardBody>
  );
}
