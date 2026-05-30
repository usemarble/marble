import { Skeleton } from "@marble/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@marble/ui/components/table";
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
          <div className="[&_[data-slot=table-container]]:scrollbar-hide overflow-hidden rounded-[20px] bg-surface p-1">
            <Table className="-mb-1 h-fit border-separate border-spacing-y-1">
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="min-w-72 pr-3">
                    <Skeleton className="h-4 w-40" />
                  </TableHead>
                  <TableHead className="px-3">
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead className="hidden px-3 md:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead className="hidden px-3 md:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                  <TableHead className="w-12 px-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow className="border-0 bg-background" key={row}>
                    <TableCell className="rounded-l-[14px] px-3 py-2">
                      <div className="flex min-w-0 max-w-82 items-center gap-3">
                        <Skeleton className="size-11 shrink-0 rounded-md" />
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-3 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <Skeleton className="h-5 w-16 rounded-[6px]" />
                    </TableCell>
                    <TableCell className="hidden px-3 py-2 md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden px-3 py-2 md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="rounded-r-[14px] px-3 py-2">
                      <Skeleton className="size-7 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
