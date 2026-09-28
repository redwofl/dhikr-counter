import { useEffect, useMemo, useState } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import ScreenHeader from "./ScreenHeader.jsx";
import Icon from "../lib/Icon.jsx";
import { computePrayerTimes, qiblaBearing, civilOffsetFor } from "../lib/prayerTimes.js";
import { LOCATION_KEY } from "../lib/storage.js";

const fmtTime = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });


export default function PrayerTimesPage({ t, onBack }) {
  const [loc, setLoc] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCATION_KEY) || "null");
    } catch {
      return null;
    }
  });
  // Same reason as the guard above: a storage access that throws (Safari
  // private mode, storage disabled by policy) must not take the page down.
  const [status, setStatus] = useState(() => {
    try {
      return localStorage.getItem(LOCATION_KEY) ? "ok" : "idle";
    } catch {
      return "idle";
    }
  });
  const [now, setNow] = useState(() => new Date());
  const [heading, setHeading] = useState(null);
  // Manual coordinate entry (fallback when geolocation is denied/unavailable)
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualError, setManualError] = useState(false);

  // tick every 30s so the "next prayer" countdown stays fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // live compass heading (device orientation), when available
  useEffect(() => {
    const handler = (e) => {
      if (e.alpha != null) setHeading(e.alpha);
    };
    window.addEventListener("deviceorientationabsolute", handler);
    window.addEventListener("deviceorientation", handler);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handler);
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

  const requestLocation = () => {
    setStatus("loading");
    const apply = (lat, lng) => {
      const l = { lat, lng };
      try {
        localStorage.setItem(LOCATION_KEY, JSON.stringify(l));
      } catch {}
      setLoc(l);
      setStatus("ok");
    };

    // Native (Android): navigator.geolocation inside the Capacitor webview
    // often times out or silently never calls back. The Capacitor plugin asks
    // for the OS permission properly (the manifest already declares
    // ACCESS_FINE/COARSE_LOCATION) and reads the real GPS/network provider.
    if (Capacitor.isNativePlatform()) {
      Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 })
        .then((pos) => apply(pos.coords.latitude, pos.coords.longitude))
        .catch(() => setStatus("denied"));
      return;
    }

    // Web: keep the browser API; it is the only one available and works fine
    // in Chrome/Safari with their own permission prompts.
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => apply(pos.coords.latitude, pos.coords.longitude),
      () => setStatus("denied"),
      { timeout: 12000, enableHighAccuracy: false }
    );
  };

  const applyManualLocation = (e) => {
    e.preventDefault();
    const lat = parseFloat(String(manualLat).replace(",", "."));
    const lng = parseFloat(String(manualLng).replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setManualError(true);
      return;
    }
    setManualError(false);
    const l = { lat, lng };
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(l));
    } catch {}
    setLoc(l);
    setStatus("ok");
  };

  const data = useMemo(() => {
    if (!loc) return null;
    try {
      // Express the times on the *location's* clock, not the device's. Without
      // this, a saved coordinate in another timezone shifted every prayer by
      // hours and Dhuhr could render as "01:29 AM".
      const tz = civilOffsetFor(loc.lng, -now.getTimezoneOffset() / 60);
      const times = computePrayerTimes(now, loc.lat, loc.lng, tz);
      const tomorrowTimes = computePrayerTimes(new Date(now.getTime() + 86400000), loc.lat, loc.lng, tz);
      const list = [
        { key: "fajr", date: times.fajr },
        { key: "sunrise", date: times.sunrise },
        { key: "dhuhr", date: times.dhuhr },
        { key: "asr", date: times.asr },
        { key: "maghrib", date: times.maghrib },
        { key: "isha", date: times.isha }
      ];
      // Take the *earliest* prayer still ahead, not the first one in the list.
      // The canonical order breaks down at high latitudes, where Isha lands
      // after midnight and therefore sorts before this morning's Fajr — a plain
      // `find` would then name Isha as "next" while Fajr was still ahead.
      const next = list
        .filter((p) => p.date > now)
        .reduce((best, p) => (best === null || p.date < best.date ? p : best), null);
      // After Isha every prayer has passed for today, so carry tomorrow's Fajr
      // into the list — the "next prayer" card and the highlighted row then
      // always agree instead of the card pointing to an unlisted time.
      //
      // The synthetic row carries its own `key`/`labelKey` pair: `key` stays
      // unique for React's list and for the isNext comparison, while `labelKey`
      // is what gets looked up in the translations. Using "fajr-tomorrow" as the
      // key *and* the label left `t["fajr-tomorrow"]` undefined, so the raw
      // string was printed on screen for every language.
      const tomorrow = { key: "fajr-tomorrow", labelKey: "fajrTomorrow", date: tomorrowTimes.fajr };
      const upcomingList = next ? list : [...list, tomorrow];
      const nextPrayer = next || tomorrow;
      const mins = Math.max(0, Math.round((nextPrayer.date - now) / 60000));
      return {
        list: upcomingList,
        nextKey: nextPrayer.key,
        nextLabelKey: nextPrayer.labelKey || nextPrayer.key,
        countdown: `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`,
        qibla: Math.round(qiblaBearing(loc.lat, loc.lng) * 10) / 10
      };
    } catch (e) {
      return null;
    }
  }, [loc, now]);

  return (
    <div className="min-h-screen pattern-bg safe-top pb-10 -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
      <div className="max-w-[330px] ms-auto me-4 px-4">
        <ScreenHeader title={t.prayerTimes || "Prayer Times"} onBack={onBack} t={t} />
        {!loc && (
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--terra)]/15 text-[var(--terra-dark)] dark:text-[var(--gold)] flex items-center justify-center mb-3">
              <Icon name="moon" size={22} />
            </div>
            <p className="text-sm text-[var(--brown-700)] dark:text-[var(--dark-muted)] mb-4">
              {status === "denied" ? t.locationDenied : status === "loading" ? t.locating : t.locationPrompt}
            </p>
            <button
              onClick={requestLocation}
              disabled={status === "loading"}
              className="px-6 py-3 rounded-2xl bg-[var(--terra-dark)] text-white font-medium active:scale-95 disabled:opacity-60"
            >
              {t.useMyLocation}
            </button>
            <div className="mt-5 pt-4 border-t border-[var(--beige)]/70 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowManual((s) => !s)}
                className="text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)] underline underline-offset-4 active:opacity-60"
              >
                {t.orEnterManually}
              </button>
              {showManual && (
                <form onSubmit={applyManualLocation} className="mt-4 flex flex-col gap-3 text-left">
                  <div className="flex gap-3">
                    <label className="flex-1">
                      <span className="block text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-1">{t.latitude}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        placeholder="21.42"
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-[var(--beige)] dark:border-white/15 text-sm text-[var(--brown-900)] dark:text-[var(--dark-text)] focus:outline-none focus:border-[var(--terra)]"
                      />
                    </label>
                    <label className="flex-1">
                      <span className="block text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-1">{t.longitude}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        placeholder="39.83"
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-[var(--beige)] dark:border-white/15 text-sm text-[var(--brown-900)] dark:text-[var(--dark-text)] focus:outline-none focus:border-[var(--terra)]"
                      />
                    </label>
                  </div>
                  {manualError && <p className="text-xs text-red-500 dark:text-red-400">{t.invalidCoordinates}</p>}
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl border border-[var(--terra-dark)] text-[var(--terra-dark)] dark:text-[var(--gold)] font-medium text-sm active:scale-95"
                  >
                    {t.applyLocation}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {loc && data && (
          <>
            <div className="rounded-2xl bg-gradient-to-b from-[#A05C2D] to-[#7E471F] text-white p-5 mb-4 shadow-lg">
              <p className="text-xs uppercase tracking-wide text-white/95 mb-1">{t.nextPrayer}</p>
              <div className="flex items-center justify-between">
                <p className="font-display text-2xl font-semibold">{t[data.nextLabelKey] || data.nextLabelKey}</p>
                <p className="text-xl font-bold tabular-nums">{data.countdown}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 px-5 mb-4">
              {data.list.map((p, i) => {
                const isNext = p.key === data.nextKey && p.date > now;
                return (
                  <div
                    key={p.key}
                    className={`flex items-center justify-between py-3.5 ${i < data.list.length - 1 ? "border-b border-[var(--beige)]/60 dark:border-white/10" : ""}`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isNext
                          ? "text-[var(--terra-dark)] dark:text-[var(--gold)]"
                          : "text-[var(--brown-900)] dark:text-[var(--dark-text)]"
                      }`}
                    >
                      {t[p.labelKey || p.key] || p.labelKey || p.key}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[var(--brown-700)] dark:text-[var(--dark-muted)]">
                      {fmtTime(p.date)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[var(--brown-900)] dark:text-[var(--dark-text)]">{t.qibla}</p>
                <p className="text-sm font-bold tabular-nums text-[var(--terra-dark)] dark:text-[var(--gold)]">
                  {data.qibla}°
                </p>
              </div>
              <div className="flex justify-center py-2">
                <div className="relative w-32 h-32 rounded-full border-2 border-[var(--beige)] dark:border-white/15 flex items-center justify-center">
                  <span className="absolute top-1 text-[10px] font-bold text-[var(--brown-500)] dark:text-[var(--dark-muted)]">N</span>
                  <span className="absolute bottom-1 text-[10px] font-bold text-[var(--brown-500)] dark:text-[var(--dark-muted)]">S</span>
                  <span className="absolute left-1.5 text-[10px] font-bold text-[var(--brown-500)] dark:text-[var(--dark-muted)]">W</span>
                  <span className="absolute right-1.5 text-[10px] font-bold text-[var(--brown-500)] dark:text-[var(--dark-muted)]">E</span>
                  <div
                    className="absolute inset-0 flex items-start justify-center pt-3"
                    style={{
                      transform: heading != null ? `rotate(${data.qibla - heading}deg)` : `rotate(${data.qibla}deg)`,
                      transition: "transform 0.3s ease"
                    }}
                  >
                    <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#C1723C] to-transparent" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[var(--terra-dark)] shadow" />
                </div>
              </div>
              <p className="text-xs text-center text-[var(--brown-500)] dark:text-[var(--dark-muted)]">
                {heading != null
                  ? `${Math.round(heading)}°`
                  : t.compassHint || "North is up — the arrow shows the Qibla bearing"}
              </p>
            </div>

            <button
              onClick={requestLocation}
              className="w-full mt-4 py-2.5 rounded-2xl text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)] border border-[var(--beige)]/70 dark:border-white/10 active:scale-95"
            >
              {status === "loading" ? t.locating : t.useMyLocation}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
