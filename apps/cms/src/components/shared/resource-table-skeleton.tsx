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

interface ResourceTableSkeletonProps {
  showAvatar?: boolean;
  showCountColumn?: boolean;
}

export function ResourceTableSkeleton({
  showAvatar = false,
  showCountColumn = false,
}: ResourceTableSkeletonProps) {
  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <div>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-9 w-full rounded-[12px] sm:w-72" />
          <Skeleton className="h-9 w-32 rounded-[12px]" />
        </div>

        <div className="overflow-hidden rounded-[20px] bg-surface p-1 [&_[data-slot=table-container]]:overflow-x-auto [&_[data-slot=table-container]]:overflow-y-hidden">
          <Table className="-mb-1 h-fit border-separate border-spacing-y-1">
            <TableHeader>
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className="px-3">
                  <Skeleton className="h-4 w-32" />
                </TableHead>
                <TableHead className="px-3">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                {showCountColumn && (
                  <TableHead className="px-3">
                    <Skeleton className="mx-auto h-4 w-12" />
                  </TableHead>
                )}
                <TableHead className="px-3">
                  <Skeleton className="ml-auto h-4 w-16" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow className="h-[60px] border-0 bg-background" key={row}>
                  <TableCell className="rounded-l-[14px] px-3 py-2">
                    <div className="flex items-center gap-3">
                      {showAvatar && (
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                      )}
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-5 w-20 rounded-[6px]" />
                  </TableCell>
                  {showCountColumn && (
                    <TableCell className="px-3 py-2">
                      <Skeleton className="mx-auto h-4 w-8" />
                    </TableCell>
                  )}
                  <TableCell className="rounded-r-[14px] px-3 py-2">
                    <Skeleton className="ml-auto size-7 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardBody>
  );
}
