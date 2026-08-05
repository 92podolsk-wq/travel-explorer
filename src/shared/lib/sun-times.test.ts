import { describe, expect, it } from "vitest";
import { getLocalTimeNow, getSunTimes } from "./sun-times";

describe("getLocalTimeNow", () => {
  it("applies a positive timezone offset", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 0, 0));
    expect(getLocalTimeNow(date, 9)).toBe("09:00");
  });

  it("wraps around midnight for large offsets", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 20, 0));
    expect(getLocalTimeNow(date, 9)).toBe("05:00");
  });

  it("handles a negative offset", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 3, 30));
    expect(getLocalTimeNow(date, -5)).toBe("22:30");
  });
});

describe("getSunTimes", () => {
  it("returns HH:MM sunrise/sunset with sunrise before sunset for a mid-latitude city in summer", () => {
    const date = new Date(Date.UTC(2026, 5, 21));
    const { sunrise, sunset } = getSunTimes(date, 34.6937, 135.5023, 9);

    expect(sunrise).toMatch(/^\d{2}:\d{2}$/);
    expect(sunset).toMatch(/^\d{2}:\d{2}$/);

    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };
    expect(toMinutes(sunrise!)).toBeLessThan(toMinutes(sunset!));
  });

  it("returns null for both during polar night at high latitude in winter", () => {
    const date = new Date(Date.UTC(2026, 11, 21));
    const { sunrise, sunset } = getSunTimes(date, 80, 20, 1);
    expect(sunrise).toBeNull();
    expect(sunset).toBeNull();
  });
});
