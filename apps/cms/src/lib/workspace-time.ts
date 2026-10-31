import { TZDate } from "@date-fns/tz";
import { wallClockToInstant } from "@marble/utils/wall-clock";
import { format } from "date-fns";

/** A time on a workspace's wall clock: a calendar day and an `HH:mm` time. */
export interface WallClockTime {
  /** Local midnight of the day, the shape the calendar component works in. */
  day: Date;
  time: string;
}

/** "Europe/London" becomes "London time". */
export function timeZoneLabel(timeZone: string) {
  const city = timeZone.split("/").at(-1) ?? timeZone;
  return `${city.replaceAll("_", " ")} time`;
}

export function toWallClockTime(
  instant: Date,
  timeZone: string
): WallClockTime {
  const zoned = new TZDate(instant, timeZone);
  return {
    day: new Date(zoned.getFullYear(), zoned.getMonth(), zoned.getDate()),
    time: format(zoned, "HH:mm"),
  };
}

/**
 * The instant a wall-clock time means in a timezone, or null for a time that
 * doesn't exist because the clocks skip it for daylight saving. A time the
 * clocks repeat means its first occurrence.
 */
export function fromWallClockTime(
  { day, time }: WallClockTime,
  timeZone: string
): Date | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (hours === undefined || minutes === undefined) {
    return null;
  }
  return wallClockToInstant(
    Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes),
    timeZone
  );
}

export function formatInTimeZone(instant: Date, timeZone: string) {
  return format(new TZDate(instant, timeZone), "MMM d, yyyy, h:mm a");
}

/** The viewer's own clock for an instant, or null if they share the timezone. */
export function viewerLocalTime(
  instant: Date,
  timeZone: string,
  viewerTimeZone: string
) {
  const inWorkspace = formatInTimeZone(instant, timeZone);
  const forViewer = formatInTimeZone(instant, viewerTimeZone);
  return inWorkspace === forViewer ? null : forViewer;
}

/** The calendar day a stored publish date shows, read in UTC as the post list does. */
export function utcCalendarDay(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function utcMidnightOf(day: Date) {
  return new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
}
