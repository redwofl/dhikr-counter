import { describe, it, expect } from "vitest";
import { computePrayerTimes, qiblaBearing, civilOffsetFor, PRAYER_KEYS } from "../prayerTimes.js";

// Expected values are Muslim World League (Fajr 18°, Isha 17°, Shafi'i Asr)
// reference times produced by the `adhan` library, in the local clock of the
// listed UTC offset. The calculation matches them to within a minute, so a
// two-minute tolerance keeps the test meaningful without being flaky.
const mins = (d) => d.getHours() * 60 + d.getMinutes();
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const expectNear = (actual, expected, tolerance = 2) => {
  expect(Math.abs(mins(actual) - toMin(expected))).toBeLessThanOrEqual(tolerance);
};

const CASES = [
  {
    name: "Istanbul in September",
    date: "2026-09-15",
    lat: 41.0082,
    lng: 28.9784,
    tz: 3,
    expected: { fajr: "05:11", sunrise: "06:44", dhuhr: "13:00", asr: "16:30", maghrib: "19:14", isha: "20:41" }
  },
  {
    name: "Istanbul in January",
    date: "2026-01-15",
    lat: 41.0082,
    lng: 28.9784,
    tz: 3,
    expected: { fajr: "06:50", sunrise: "08:27", dhuhr: "13:14", asr: "15:42", maghrib: "18:00", isha: "19:33" }
  },
  {
    name: "Istanbul at the June solstice",
    date: "2026-06-21",
    lat: 41.0082,
    lng: 28.9784,
    tz: 3,
    expected: { fajr: "03:24", sunrise: "05:32", dhuhr: "13:07", asr: "17:07", maghrib: "20:40", isha: "22:38" }
  },
  {
    name: "Makkah",
    date: "2026-09-15",
    lat: 21.4225,
    lng: 39.8262,
    tz: 3,
    expected: { fajr: "04:53", sunrise: "06:08", dhuhr: "12:17", asr: "15:41", maghrib: "18:24", isha: "19:34" }
  },
  {
    name: "Jakarta (southern hemisphere)",
    date: "2026-01-15",
    lat: -6.2088,
    lng: 106.8456,
    tz: 7,
    expected: { fajr: "04:34", sunrise: "05:49", dhuhr: "12:03", asr: "15:27", maghrib: "18:15", isha: "19:26" }
  }
];

describe("computePrayerTimes", () => {
  it.each(CASES)("$name matches reference times", ({ date, lat, lng, tz, expected }) => {
    const times = computePrayerTimes(new Date(`${date}T12:00:00Z`), lat, lng, tz);
    PRAYER_KEYS.forEach((key) => expectNear(times[key], expected[key]));
  });

  // Regression: the twilight angles were applied as +18°/+17° altitudes, which
  // put Fajr after sunrise and Isha before Maghrib.
  it("keeps Fajr before sunrise and Isha after Maghrib all year", () => {
    ["2026-01-15", "2026-03-20", "2026-06-21", "2026-09-15", "2026-12-21"].forEach((date) => {
      const times = computePrayerTimes(new Date(`${date}T12:00:00Z`), 41.0082, 28.9784, 3);
      expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
      expect(times.isha.getTime()).toBeGreaterThan(times.maghrib.getTime());
    });
  });

  it("returns the six rows in chronological order within one day", () => {
    const times = computePrayerTimes(new Date("2026-09-15T12:00:00Z"), 41.0082, 28.9784, 3);
    const ordered = PRAYER_KEYS.map((k) => times[k].getTime());
    ordered.forEach((t, i) => {
      if (i > 0) expect(t).toBeGreaterThan(ordered[i - 1]);
    });
  });

  it("shifts with the requested clock offset rather than the device's", () => {
    const date = new Date("2026-09-15T12:00:00Z");
    const at3 = computePrayerTimes(date, 41.0082, 28.9784, 3);
    const at4 = computePrayerTimes(date, 41.0082, 28.9784, 4);
    expect(mins(at4.dhuhr) - mins(at3.dhuhr)).toBe(60);
  });

  // At 51.5°N in June the sun never dips 18° below the horizon, so Isha has to
  // roll past midnight instead of being clamped to 23:59.
  it("rolls Isha into the next day at high latitude instead of clamping", () => {
    const times = computePrayerTimes(new Date("2026-06-21T12:00:00Z"), 51.5074, -0.1278, 1);
    expect(times.isha.getDate()).toBe(22);
  });
});

describe("civilOffsetFor", () => {
  // Regression: the prayer screen passed no offset, so computePrayerTimes fell
  // back to the *device's* offset no matter where the saved coordinates were.
  // Mountain View coordinates on a UTC+5:30 phone rendered Dhuhr as "01:29 AM".
  it("keeps the device offset when the device is plausibly at the location", () => {
    // Someone using prayer times where they actually are: the device knows
    // about DST and borders in a way longitude never can.
    expect(civilOffsetFor(77.2, 5.5)).toBe(5.5); // Delhi on an IST phone
    expect(civilOffsetFor(-0.13, 1)).toBe(1); // London on a BST phone
    expect(civilOffsetFor(-74, -4)).toBe(-4); // New York on an EDT phone
  });

  it("uses the location instead of a device in a different timezone", () => {
    expect(civilOffsetFor(-122.08, 5.5)).toBe(-8); // Mountain View, not +5:30
    expect(civilOffsetFor(39.83, 5.5)).toBe(3); // Makkah, not +5:30
    expect(civilOffsetFor(28.98, -8)).toBe(2); // Istanbul, not -8
  });

  it("always lands on an offset a real timezone uses", () => {
    for (let lng = -180; lng <= 180; lng += 1.5) {
      const off = civilOffsetFor(lng, undefined);
      expect(Number.isInteger(off * 4)).toBe(true); // quarter-hour granularity
      expect(off).toBeGreaterThanOrEqual(-12);
      expect(off).toBeLessThanOrEqual(14);
    }
  });

  it("falls back to longitude when the device offset is unknown", () => {
    // No timezone database ships with the app, so a remote coordinate can only
    // be placed from its longitude, snapped to an offset some zone really uses.
    // That is exact for whole-hour zones and can be 30-45 min out for half- and
    // quarter-hour ones (Delhi is UTC+5:30 but sits on solar 5:09, so it snaps
    // to +5). Pinned here so the limit is a known quantity, not a surprise.
    expect(civilOffsetFor(106.85, undefined)).toBe(7); // Jakarta
    expect(civilOffsetFor(-122.08, undefined)).toBe(-8); // Mountain View
    expect(civilOffsetFor(77.2, undefined)).toBe(5); // Delhi, 30 min under IST
  });

  it("still returns a usable offset for an absent or malformed device offset", () => {
    expect(civilOffsetFor(-122.08, null)).toBe(-8);
    expect(civilOffsetFor(-122.08, NaN)).toBe(-8);
  });
});

describe("qiblaBearing", () => {
  it.each([
    ["Istanbul", 41.0082, 28.9784, 151.6],
    ["London", 51.5074, -0.1278, 119.0],
    ["Jakarta", -6.2088, 106.8456, 295.2],
    ["New York", 40.7128, -74.006, 58.5]
  ])("%s points %f° from north", (_name, lat, lng, expected) => {
    expect(Math.abs(qiblaBearing(lat, lng) - expected)).toBeLessThan(0.5);
  });

  it("always returns a bearing within 0-360", () => {
    for (let lat = -60; lat <= 60; lat += 15) {
      for (let lng = -180; lng <= 180; lng += 30) {
        const b = qiblaBearing(lat, lng);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(360);
      }
    }
  });
});
