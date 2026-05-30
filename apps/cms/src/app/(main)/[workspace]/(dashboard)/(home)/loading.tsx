import { Skeleton } from "@marble/ui/components/skeleton";
import { DashboardBody } from "@/components/layout/wrapper";

const apiBars = [
  { id: "api-1", height: "h-[35%]" },
  { id: "api-2", height: "h-[55%]" },
  { id: "api-3", height: "h-[40%]" },
  { id: "api-4", height: "h-[70%]" },
  { id: "api-5", height: "h-[50%]" },
  { id: "api-6", height: "h-[80%]" },
  { id: "api-7", height: "h-[60%]" },
  { id: "api-8", height: "h-[45%]" },
  { id: "api-9", height: "h-[90%]" },
  { id: "api-10", height: "h-[65%]" },
  { id: "api-11", height: "h-[50%]" },
  { id: "api-12", height: "h-[75%]" },
  { id: "api-13", height: "h-[40%]" },
  { id: "api-14", height: "h-[85%]" },
  { id: "api-15", height: "h-[55%]" },
  { id: "api-16", height: "h-[60%]" },
  { id: "api-17", height: "h-[70%]" },
  { id: "api-18", height: "h-[45%]" },
  { id: "api-19", height: "h-[95%]" },
  { id: "api-20", height: "h-[50%]" },
  { id: "api-21", height: "h-[65%]" },
  { id: "api-22", height: "h-[80%]" },
  { id: "api-23", height: "h-[55%]" },
  { id: "api-24", height: "h-[70%]" },
];

const webhookBars = [
  { id: "wh-1", height: "h-[30%]" },
  { id: "wh-2", height: "h-[60%]" },
  { id: "wh-3", height: "h-[45%]" },
  { id: "wh-4", height: "h-[75%]" },
  { id: "wh-5", height: "h-[55%]" },
  { id: "wh-6", height: "h-[85%]" },
  { id: "wh-7", height: "h-[40%]" },
  { id: "wh-8", height: "h-[65%]" },
  { id: "wh-9", height: "h-[50%]" },
  { id: "wh-10", height: "h-[70%]" },
  { id: "wh-11", height: "h-[35%]" },
  { id: "wh-12", height: "h-[60%]" },
];

const mediaRows = ["media-1", "media-2", "media-3"];

const activityWeeks = Array.from({ length: 53 }, (_, i) => `week-${i}`);
const activityDays = ["d-0", "d-1", "d-2", "d-3", "d-4", "d-5", "d-6"];

function CardHeaderSkeleton() {
  return (
    <div className="gap-0 px-4 pt-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-1 h-6 w-28" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <DashboardBody className="flex flex-col gap-8 pt-10 pb-16" size="compact">
      <div className="flex w-full flex-col gap-6 md:grid md:gap-x-10 md:gap-y-8">
        <div className="col-span-full flex flex-col gap-4 rounded-[20px] bg-surface p-2">
          <CardHeaderSkeleton />
          <div className="flex h-84 items-end justify-between gap-2 rounded-[12px] bg-background p-4 shadow-xs">
            {apiBars.map((bar) => (
              <Skeleton
                className={`w-full rounded-t-md ${bar.height}`}
                key={bar.id}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col gap-4 rounded-[20px] bg-surface p-2">
            <CardHeaderSkeleton />
            <div className="flex h-60 items-end justify-between gap-2 rounded-[12px] bg-background p-4 shadow-xs">
              {webhookBars.map((bar) => (
                <Skeleton
                  className={`w-full rounded-t-md ${bar.height}`}
                  key={bar.id}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[20px] bg-surface p-2">
            <CardHeaderSkeleton />
            <ul className="flex h-60 flex-col gap-2 overflow-hidden rounded-[12px]">
              {mediaRows.map((id) => (
                <li
                  className="flex items-center gap-4 rounded-[18px] bg-background p-2.5"
                  key={id}
                >
                  <Skeleton className="size-20 shrink-0 rounded-[8px]" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[20px] bg-surface p-2">
          <CardHeaderSkeleton />
          <div className="rounded-[12px] bg-background p-4 shadow-xs">
            <div className="flex gap-[3px] overflow-hidden">
              {activityWeeks.map((week) => (
                <div className="flex flex-col gap-[3px]" key={week}>
                  {activityDays.map((day) => (
                    <Skeleton
                      className="size-[13px] rounded-[2px]"
                      key={`${week}-${day}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardBody>
  );
}
