import { describe, expect, it } from "vitest";
import {
  formatInTimeZone,
  fromWallClockTime,
  timeZoneLabel,
  toWallClockTime,
  utcCalendarDay,
  utcMidnightOf,
  viewerLocalTime,
} from "./workspace-time";

describe("workspace time", () => {
  it("names a timezone by its city", () => {
    expect(timeZoneLabel("Europe/London")).toBe("London time");
    expect(timeZoneLabel("America/New_York")).toBe("New York time");
  });

  it("reads a wall-clock time as an instant in the workspace timezone", () => {
    const day = new Date(2026, 9, 23);
    expect(
      fromWallClockTime({ day, time: "09:00" }, "Europe/London")?.toISOString()
    ).toBe("2026-10-23T08:00:00.000Z");
    expect(
      fromWallClockTime(
        { day, time: "09:00" },
        "America/New_York"
      )?.toISOString()
    ).toBe("2026-10-23T13:00:00.000Z");
  });

  it("round-trips an instant through the wall clock", () => {
    const instant = new Date("2026-10-23T01:30:00.000Z");
    const wallClock = toWallClockTime(instant, "America/New_York");
    expect(wallClock.time).toBe("21:30");
    expect(wallClock.day.getDate()).toBe(22);
    expect(fromWallClockTime(wallClock, "America/New_York")).toEqual(instant);
  });

  it("rejects a time the clocks skip for daylight saving", () => {
    expect(
      fromWallClockTime(
        { day: new Date(2027, 2, 14), time: "02:30" },
        "America/New_York"
      )
    ).toBeNull();
  });

  it("accepts a time that happens twice when the clocks go back", () => {
    expect(
      fromWallClockTime(
        { day: new Date(2026, 10, 1), time: "01:30" },
        "America/New_York"
      )
    ).toBeInstanceOf(Date);
  });

  it("formats an instant on the workspace clock", () => {
    expect(
      formatInTimeZone(new Date("2026-10-23T08:00:00Z"), "Europe/London")
    ).toBe("Oct 23, 2026, 9:00 AM");
  });

  it("shows the viewer's clock only when it differs", () => {
    const instant = new Date("2026-10-23T08:00:00Z");
    expect(viewerLocalTime(instant, "Europe/London", "America/New_York")).toBe(
      "Oct 23, 2026, 4:00 AM"
    );
    expect(
      viewerLocalTime(instant, "Europe/London", "Europe/London")
    ).toBeNull();
  });

  it("keeps stored UTC-midnight dates on their calendar day", () => {
    const stored = new Date("2024-03-18T00:00:00Z");
    const day = utcCalendarDay(stored);
    expect([day.getFullYear(), day.getMonth(), day.getDate()]).toEqual([
      2024, 2, 18,
    ]);
    expect(utcMidnightOf(day)).toEqual(stored);
  });
});
