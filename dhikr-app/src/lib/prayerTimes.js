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
