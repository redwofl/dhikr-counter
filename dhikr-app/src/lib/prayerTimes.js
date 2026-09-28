// Pure prayer-time + Qibla math — no React, no dependencies, unit tested.
//
// Standard astronomical algorithm (Meeus, as popularised by PrayTimes.org /
// Zulfikar Ali) using Muslim World League angles:
//   Fajr 18°, Isha 17°, Asr shadow factor 1 (Shafi'i), Maghrib = sunset.
//
// Kept dependency-free so it bundles unchanged in Capacitor's offline runtime.

// Degrees below the horizon used for the twilight prayers (Muslim World League).
export const FAJR_ANGLE = 18;
export const ISHA_ANGLE = 17;

/**
 * Every civil UTC offset any real timezone uses. Prayer times are wall-clock
 * times for a *place*, so the offset must come from the location — but the app
 * has no timezone database, only coordinates. These constants let
 * `civilOffsetFor` snap a longitude-derived offset onto an offset some real
 * zone actually uses instead of inventing one like -8.13.
 */
const CIVIL_OFFSETS = [
  -12, -11, -10, -9.5, -9, -8, -7, -6, -5, -4, -3.5, -3, -2, -1, 0, 1, 2, 3, 3.5,
  4, 4.5, 5, 5.5, 5.75, 6, 6.5, 7, 8, 8.75, 9, 9.5, 10, 10.5, 11, 12, 12.75, 13,
  13.75, 14
];

/**
 * The UTC offset prayer times should be expressed on, for a location at
 * `lng` viewed from a device whose own clock is at `deviceOffset`.
 *
 * Solar time at the location is `lng / 15` hours from UTC, and civil offsets
 * track it closely, so longitude is the right basis for a location far from the
 * device. It is only an approximation: it ignores daylight saving and
 * political borders, and a handful of countries sit 1–2 h off their longitude
 * (all of China at +8, Spain, Iceland).
 *
 * So prefer the device's own offset whenever it is *consistent* with the
 * location — that is the common case (someone using prayer times where they
 * actually are) and the device knows about DST and borders. Only when the two
 * disagree wildly does the location win, which is the case that used to render
 * Dhuhr as "01:29 AM" for a US coordinate on a UTC+5:30 phone.
 */
export function civilOffsetFor(lng, deviceOffset) {
  const solar = lng / 15;
  if (Number.isFinite(deviceOffset) && Math.abs(deviceOffset - solar) <= 1.5) {
    return deviceOffset;
  }
  return CIVIL_OFFSETS.reduce((best, o) =>
    Math.abs(o - solar) < Math.abs(best - solar) ? o : best
  );
}
// The sun's centre sits 0.833° below the horizon at apparent sunrise/sunset.
const SUNRISE_ANGLE = 0.833;

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

const sin = (deg) => Math.sin(deg * D2R);
const cos = (deg) => Math.cos(deg * D2R);
const tan = (deg) => Math.tan(deg * D2R);
const clamp = (x) => Math.max(-1, Math.min(1, x));
const fixAngle = (a) => ((a % 360) + 360) % 360;
const fixHour = (h) => ((h % 24) + 24) % 24;

// Julian day for an instant (Unix epoch → JD).
export const julianDay = (date) => date.valueOf() / 86400000 + 2440587.5;

// Sun declination (degrees) and equation of time (hours) for a Julian day.
const sunPosition = (jd) => {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D); // mean anomaly
  const q = fixAngle(280.459 + 0.98564736 * D); // mean longitude
  const L = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g)); // ecliptic longitude
  const e = 23.439 - 0.00000036 * D; // obliquity
  // atan2 resolves the quadrant; a plain atan() needs a hand-rolled (and
  // easily wrong) correction, which is what skewed the equation of time here.
  const RA = fixHour((Math.atan2(cos(e) * sin(L), cos(L)) * R2D) / 15);
  return { declination: Math.asin(clamp(sin(e) * sin(L))) * R2D, equation: q / 15 - RA };
};

/**
 * Prayer times for a date and position, expressed on the clock of the given
 * UTC offset (defaults to the device's own offset).
 *
 * Returns Dates whose *local wall clock* matches the computed times, which is
 * what the app renders — so `date` is expected to be "today" on that clock.
 */
export function computePrayerTimes(date, lat, lng, tzOffsetHours) {
  const jd = julianDay(date);
  const tz = tzOffsetHours == null ? -date.getTimezoneOffset() / 60 : tzOffsetHours;

  const midDay = (t) => fixHour(12 - sunPosition(jd + t / 24).equation);

  // Hour angle for a sun altitude (negative = below the horizon); `ccw` picks
  // the morning side of the day. Altitudes below the horizon are *negative* —
  // passing +18/+17 here is what put Fajr after sunrise and Isha before Maghrib.
  const sunAngleTime = (altitude, t, ccw) => {
    const decl = sunPosition(jd + t / 24).declination;
    const noon = midDay(t);
    const x = (sin(altitude) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
    const offset = (Math.acos(clamp(x)) * R2D) / 15;
    return noon + (ccw ? -offset : offset);
  };

  // Asr: the sun's altitude when an object casts a shadow of `factor` its height.
  const asrTime = (t, shadowFactor = 1) => {
    const decl = sunPosition(jd + t / 24).declination;
    const altitude = Math.atan(1 / (shadowFactor + tan(Math.abs(lat - decl)))) * R2D;
    return sunAngleTime(altitude, t, false);
  };

  const fajr = sunAngleTime(-FAJR_ANGLE, 5, true);
  const sunrise = sunAngleTime(-SUNRISE_ANGLE, 6, true);
  const dhuhr = midDay(12);
  const asr = asrTime(13);
  const maghrib = sunAngleTime(-SUNRISE_ANGLE, 18, false);
  const isha = sunAngleTime(-ISHA_ANGLE, 18, false);

  // Express the solar hours on the wanted clock.
  const shift = tz - lng / 15;
  // Keep the raw solar hours here (no 24h wrap): at high latitude Isha comes out
  // as e.g. 24.05 and must land *after* midnight on the next day, while Fajr
  // comes out just over 0 and stays on the same morning. setMinutes rolls the
  // date over by itself, so nothing gets clamped to 23:59 either.
  const toDate = (hours) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(Math.round((hours + shift) * 60));
    return d;
  };

  return {
    fajr: toDate(fajr),
    sunrise: toDate(sunrise),
    dhuhr: toDate(dhuhr),
    asr: toDate(asr),
    maghrib: toDate(maghrib),
    isha: toDate(isha)
  };
}

/** Qibla bearing from north (degrees) — great circle to the Kaaba. */
export function qiblaBearing(lat, lng) {
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;
  const dLng = (kaabaLng - lng) * D2R;
  const y = Math.sin(dLng);
  const x = cos(lat) * tan(kaabaLat) - sin(lat) * Math.cos(dLng);
  return ((Math.atan2(y, x) * R2D) % 360 + 360) % 360;
}

/** Ordered list of the six rows shown on the Prayer Times screen. */
export const PRAYER_KEYS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
