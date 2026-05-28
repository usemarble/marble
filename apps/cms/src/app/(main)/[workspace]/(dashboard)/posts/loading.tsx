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

export default function Loading() {
  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <div>
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Skeleton className="h-9 w-full rounded-[12px] sm:w-72" />
            <Skeleton className="h-9 w-36 rounded-[12px]" />
            <Skeleton className="h-9 w-32 rounded-[12px]" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <Skeleton className="h-9 w-[76px] rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-[20px] bg-surface p-1">
            <div className="flex items-center gap-4 px-3 py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto hidden h-4 w-24 md:block" />
              <Skeleton className="hidden h-4 w-24 md:block" />
            </div>
            <div className="flex flex-col gap-1">
              {rows.map((row) => (
                <div
                  className="flex items-center gap-4 rounded-[14px] bg-background px-3 py-3"
                  key={row}
                >
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="ml-auto hidden h-4 w-24 md:block" />
                  <Skeleton className="hidden h-4 w-24 md:block" />
                  <Skeleton className="size-7 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="hidden size-8 lg:block" />
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
              <Skeleton className="hidden size-8 lg:block" />
            </div>
          </div>
        </div>
      </div>
    </DashboardBody>
  );
}
