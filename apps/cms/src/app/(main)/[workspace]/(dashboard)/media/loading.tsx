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
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-full rounded-[12px] sm:w-72" />
            <Skeleton className="h-9 w-24 rounded-[12px]" />
            <Skeleton className="h-9 w-24 rounded-[12px]" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-9 w-28" />
          </div>
        </section>

        <div className="flex flex-col gap-3">
          <div className="rounded-[20px] bg-surface p-1">
            <div className="flex items-center gap-4 px-3 py-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto hidden h-4 w-24 md:block" />
            </div>
            <div className="flex flex-col gap-1">
              {rows.map((row) => (
                <div
                  className="flex items-center gap-4 rounded-[14px] bg-background px-3 py-2"
                  key={row}
                >
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="size-10 rounded-md" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="ml-auto hidden h-4 w-24 md:block" />
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
