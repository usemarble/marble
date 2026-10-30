"use client";

import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Tabs, TabsList, TabsTrigger } from "@marble/ui/components/tabs";
import { cn } from "@marble/ui/lib/utils";
import { CalendarDotsIcon, CaretDownIcon } from "@phosphor-icons/react";
import { addDays, format, isAfter, startOfDay } from "date-fns";
import { useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { POST_STATUS_PRESENTATION } from "@/lib/post-status";
import {
  formatInTimeZone,
  fromWallClockTime,
  timeZoneLabel,
  toWallClockTime,
  utcCalendarDay,
  utcMidnightOf,
  viewerLocalTime,
  type WallClockTime,
} from "@/lib/workspace-time";
import { useWorkspace } from "@/providers/workspace";
import { type PublicationRequest, useEditorData } from "./editor-data-provider";
import { FieldInfo } from "./fields/field-info";

const FALLBACK_TIME_ZONE = "Europe/London";
const DEFAULT_GO_LIVE_TIME = "09:00";

function DayPicker({
  disabled,
  onSelect,
  selected,
}: {
  disabled?: (day: Date) => boolean;
  onSelect: (day: Date) => void;
  selected: Date;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className="w-full justify-between bg-editor-field text-left font-normal shadow-none active:scale-100"
            variant="outline"
          >
            {format(selected, "PPP")}
            <CalendarDotsIcon className="text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent className="w-auto overflow-hidden p-0">
        <Calendar
          autoFocus
          captionLayout="dropdown"
          disabled={disabled}
          mode="single"
          onSelect={(day: Date | undefined) => {
            if (day) {
              onSelect(day);
            }
          }}
          selected={selected}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Picks a go-live time on the workspace clock and reports what it means. */
function GoLivePicker({
  instant,
  onChange,
  timeZone,
  value,
}: {
  instant: Date | null;
  onChange: (value: WallClockTime) => void;
  timeZone: string;
  value: WallClockTime;
}) {
  const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const viewerTime =
    instant && viewerLocalTime(instant, timeZone, viewerTimeZone);
  const info = [
    `Times use your workspace timezone (${timeZone}). Change it in Settings.`,
    viewerTime && `That's ${viewerTime} for you.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-2">
      <Label>Goes live</Label>
      <DayPicker
        disabled={(day) => day < toWallClockTime(new Date(), timeZone).day}
        onSelect={(day) => onChange({ ...value, day })}
        selected={value.day}
      />
      <Input
        aria-label="Go-live time"
        className="bg-editor-field"
        onChange={(event) => onChange({ ...value, time: event.target.value })}
        type="time"
        value={value.time}
      />
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        <span>{timeZoneLabel(timeZone)}</span>
        <FieldInfo className="size-3.5 text-muted-foreground" text={info} />
      </div>
    </div>
  );
}

function PublishDatePicker({
  label,
  onSelect,
  selected,
}: {
  label: string;
  onSelect: (day: Date) => void;
  selected: Date;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <DayPicker
        disabled={(day) => isAfter(day, new Date())}
        onSelect={onSelect}
        selected={selected}
      />
    </div>
  );
}

function goLiveError(time: string, instant: Date | null) {
  if (!time) {
    return "Choose a time.";
  }
  if (!instant) {
    return "That time doesn't exist on this day because of daylight saving.";
  }
  return instant <= new Date() ? "Choose a time in the future." : null;
}

function PublishForm({
  onDone,
  timeZone,
}: {
  onDone: () => void;
  timeZone: string;
}) {
  const { changePublication, isSubmitting, publication } = useEditorData();
  const { status, publishedAt } = publication;

  const [mode, setMode] = useState<"now" | "later">("now");
  const [goLive, setGoLive] = useState<WallClockTime>(() =>
    status === "scheduled"
      ? toWallClockTime(publishedAt, timeZone)
      : {
          day: addDays(toWallClockTime(new Date(), timeZone).day, 1),
          time: DEFAULT_GO_LIVE_TIME,
        }
  );
  // A draft can keep a future date after it is unscheduled. Publishing now
  // can't honour it, so the picker starts from today.
  const [initialPublishDay] = useState(() =>
    status === "draft" && publishedAt > new Date()
      ? startOfDay(new Date())
      : utcCalendarDay(publishedAt)
  );
  const [publishDay, setPublishDay] = useState(initialPublishDay);

  const goLiveInstant = fromWallClockTime(goLive, timeZone);
  const goLiveProblem = goLiveError(goLive.time, goLiveInstant);
  const publishDayChanged =
    publishDay.getTime() !== initialPublishDay.getTime();

  const run = async (request: PublicationRequest) => {
    if (await changePublication(request)) {
      onDone();
    }
  };

  const publishNow = () =>
    run({
      status: "published",
      publishedAt: publishDayChanged ? utcMidnightOf(publishDay) : undefined,
    });

  const schedule = () => {
    if (goLiveInstant) {
      run({ status: "scheduled", publishedAt: goLiveInstant });
    }
  };

  if (status === "published") {
    return (
      <>
        <PublishDatePicker
          label="Published on"
          onSelect={setPublishDay}
          selected={publishDay}
        />
        {publishDayChanged && (
          <AsyncButton
            className="w-full"
            isLoading={isSubmitting}
            onClick={() =>
              run({
                status: "published",
                publishedAt: utcMidnightOf(publishDay),
              })
            }
            type="button"
          >
            Update date
          </AsyncButton>
        )}
        <AsyncButton
          className="w-full"
          isLoading={isSubmitting}
          onClick={() => run({ status: "draft" })}
          type="button"
          variant="outline"
        >
          Unpublish
        </AsyncButton>
      </>
    );
  }

  if (status === "scheduled") {
    const goLiveChanged =
      goLiveInstant?.getTime() !== new Date(publishedAt).setSeconds(0, 0);
    return (
      <>
        <GoLivePicker
          instant={goLiveInstant}
          onChange={setGoLive}
          timeZone={timeZone}
          value={goLive}
        />
        {goLiveChanged && goLiveProblem && (
          <ErrorMessage className="text-sm">{goLiveProblem}</ErrorMessage>
        )}
        <AsyncButton
          className="w-full"
          disabled={!goLiveChanged || Boolean(goLiveProblem)}
          isLoading={isSubmitting}
          onClick={schedule}
          type="button"
        >
          Reschedule
        </AsyncButton>
        <div className="grid grid-cols-2 gap-2">
          <AsyncButton
            isLoading={isSubmitting}
            onClick={() => run({ status: "published" })}
            type="button"
            variant="outline"
          >
            Publish now
          </AsyncButton>
          <AsyncButton
            isLoading={isSubmitting}
            onClick={() => run({ status: "draft" })}
            type="button"
            variant="outline"
          >
            Unschedule
          </AsyncButton>
        </div>
      </>
    );
  }

  return (
    <>
      <Tabs onValueChange={(value) => setMode(value)} value={mode}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="now">Now</TabsTrigger>
          <TabsTrigger value="later">Later</TabsTrigger>
        </TabsList>
      </Tabs>
      {mode === "now" ? (
        <>
          <PublishDatePicker
            label="Publish date"
            onSelect={setPublishDay}
            selected={publishDay}
          />
          <AsyncButton
            className="w-full"
            isLoading={isSubmitting}
            onClick={publishNow}
            type="button"
          >
            Publish
          </AsyncButton>
        </>
      ) : (
        <>
          <GoLivePicker
            instant={goLiveInstant}
            onChange={setGoLive}
            timeZone={timeZone}
            value={goLive}
          />
          {goLiveProblem && (
            <ErrorMessage className="text-sm">{goLiveProblem}</ErrorMessage>
          )}
          <AsyncButton
            className="w-full"
            disabled={Boolean(goLiveProblem)}
            isLoading={isSubmitting}
            onClick={schedule}
            type="button"
          >
            Schedule
          </AsyncButton>
        </>
      )}
    </>
  );
}

const STATUS_DOT = {
  draft: "bg-muted-foreground",
  scheduled: "bg-blue-500",
  published: "bg-emerald-500",
} as const;

export function PublishPopover() {
  const { activeWorkspace } = useWorkspace();
  const { publication, refreshPublication, postId } = useEditorData();
  const [open, setOpen] = useState(false);
  const timeZone = activeWorkspace?.timezone ?? FALLBACK_TIME_ZONE;
  const { label } = POST_STATUS_PRESENTATION[publication.status];
  const summary =
    publication.status === "scheduled"
      ? `Goes live ${formatInTimeZone(publication.publishedAt, timeZone)}`
      : label;

  return (
    <Popover
      onOpenChange={(next) => {
        setOpen(next);
        if (next && postId) {
          refreshPublication();
        }
      }}
      open={open}
    >
      <PopoverTrigger
        render={
          <Button
            aria-label={`Post status: ${summary}. Change publishing options`}
            size="sm"
            type="button"
            variant="ghost"
          >
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                STATUS_DOT[publication.status]
              )}
            />
            {label}
            <CaretDownIcon className="text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="end" className="flex w-80 flex-col gap-4 p-4">
        <p className="font-medium text-sm">{label}</p>
        {/* Keyed so a refetch that finds a new status or time resets the form. */}
        <PublishForm
          key={`${publication.status}:${publication.publishedAt.getTime()}`}
          onDone={() => setOpen(false)}
          timeZone={timeZone}
        />
      </PopoverContent>
    </Popover>
  );
}
