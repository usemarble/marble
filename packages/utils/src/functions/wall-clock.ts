import { tzOffset } from "@date-fns/tz";

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/**
 * The instant a wall-clock time means in a timezone, without reading the system
 * timezone. Pass the time as if it were UTC, such as `Date.UTC(2026, 10, 1, 9)`.
 *
 * A time the clocks repeat means its first occurrence. A time the clocks skip
 * returns null.
 */
export function wallClockToInstant(
  wallClockMs: number,
  timeZone: string
): Date | null {
  const candidates = [wallClockMs - DAY_MS, wallClockMs + DAY_MS]
    .map((around) => tzOffset(timeZone, new Date(around)))
    .map((offset) => wallClockMs - offset * MINUTE_MS)
    .filter(
      (instant) =>
        instant + tzOffset(timeZone, new Date(instant)) * MINUTE_MS ===
        wallClockMs
    );
  return candidates.length > 0 ? new Date(Math.min(...candidates)) : null;
}
