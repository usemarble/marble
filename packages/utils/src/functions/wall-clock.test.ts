import { describe, expect, it } from "vitest";
import { wallClockToInstant } from "./wall-clock";

const utc = (value: string) => new Date(`${value}Z`).getTime();
const resolve = (value: string, timeZone: string) =>
  wallClockToInstant(utc(value), timeZone)?.toISOString() ?? null;

describe("wallClockToInstant", () => {
  it.each([
    ["Europe/London", "2031-07-01T09:00:00", "2031-07-01T08:00:00.000Z"],
    ["Europe/London", "2031-01-15T09:00:00", "2031-01-15T09:00:00.000Z"],
    ["America/New_York", "2031-07-01T09:00:00", "2031-07-01T13:00:00.000Z"],
    ["Asia/Kathmandu", "2031-07-01T09:00:00", "2031-07-01T03:15:00.000Z"],
    ["Pacific/Kiritimati", "2031-07-01T09:00:00", "2031-06-30T19:00:00.000Z"],
    ["Pacific/Pago_Pago", "2031-07-01T09:00:00", "2031-07-01T20:00:00.000Z"],
    ["UTC", "2031-07-01T09:15:30.250", "2031-07-01T09:15:30.250Z"],
  ])("reads an ordinary time in %s", (timeZone, value, expected) => {
    expect(resolve(value, timeZone)).toBe(expected);
  });

  it.each([
    ["Europe/London", "2031-10-26T01:30:00", "2031-10-26T00:30:00.000Z"],
    ["America/New_York", "2026-11-01T01:30:00", "2026-11-01T05:30:00.000Z"],
    ["Australia/Sydney", "2027-04-04T02:30:00", "2027-04-03T15:30:00.000Z"],
    ["Australia/Lord_Howe", "2027-04-04T01:45:00", "2027-04-03T14:45:00.000Z"],
    ["America/Havana", "2031-11-02T00:30:00", "2031-11-02T04:30:00.000Z"],
  ])(
    "takes the first occurrence of a repeated time in %s",
    (timeZone, value, expected) => {
      expect(resolve(value, timeZone)).toBe(expected);
    }
  );

  it.each([
    ["Europe/London", "2031-03-30T01:30:00"],
    ["America/New_York", "2027-03-14T02:30:00"],
    ["Australia/Sydney", "2027-10-03T02:30:00"],
    ["Australia/Lord_Howe", "2027-10-03T02:15:00"],
    ["America/Havana", "2031-03-09T00:30:00"],
    ["Pacific/Apia", "2011-12-30T12:00:00"],
  ])("returns null for a time the clocks skip in %s", (timeZone, value) => {
    expect(resolve(value, timeZone)).toBeNull();
  });

  it("reads the edges of a change as ordinary times", () => {
    expect(resolve("2031-10-26T00:59:59", "Europe/London")).toBe(
      "2031-10-25T23:59:59.000Z"
    );
    expect(resolve("2031-10-26T02:00:00", "Europe/London")).toBe(
      "2031-10-26T02:00:00.000Z"
    );
    expect(resolve("2031-03-30T00:59:59", "Europe/London")).toBe(
      "2031-03-30T00:59:59.000Z"
    );
    expect(resolve("2031-03-30T02:00:00", "Europe/London")).toBe(
      "2031-03-30T01:00:00.000Z"
    );
  });

  it("resolves a date before standard time", () => {
    expect(resolve("1800-01-01T09:00:00", "Europe/London")).not.toBeNull();
    expect(resolve("1900-06-01T09:00:00", "America/New_York")).not.toBeNull();
  });
});
