export const STORAGE_KEY = "dhikr_app_v1";
// Saved GPS coordinates for the prayer times screen. Kept beside the main
// save rather than inside it because PrayerTimesPage reads it directly on
// mount, before any state is available — but "Reset All Data" has to clear it
// too, or the erased coordinates survive a reset the user was told was
// permanent.
export const LOCATION_KEY = "dhikr_location";

export function freshState(defaultSettings) {
  return {
    version: 1,
    customTemplates: [],
    deletedDefaultIds: [],
    session: null,
    settings: { ...defaultSettings },
    introCompleted: false,
    dailyStats: {},
    adhkarProgress: {},
    salahProgress: {}
  };
}

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const count = (v) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.trunc(Number(v)) : 0);

/**
 * Coerces a dailyStats map into `day -> { repetitions, sessions }` with
 * non-negative integers. A hand-edited or truncated backup could otherwise
 * carry a string here, which `0 + "5"` turns into "05" and
 * `ProgressPage`'s `.toLocaleString()` then crashes on.
 */
export function repairDailyStats(value) {
  if (!isPlainObject(value)) return {};
  const out = {};
  for (const [key, day] of Object.entries(value)) {
    if (!isPlainObject(day)) continue;
    out[key] = { ...day, repetitions: count(day.repetitions), sessions: count(day.sessions) };
  }
  return out;
}

/**
 * Fills in anything missing from a state object that is otherwise usable.
 *
 * Stored state can be *almost* right: `version: 1` is shared by every build, so
 * a save written before a field existed (or by an older release) arrives missing
 * it, and `loadState` used to hand that straight to React. The first render
 * then called `.includes` on an absent array, or `.toLocaleString()` on a
 * string, and dropped the user into the ErrorBoundary — whose only recovery
 * button erases the whole save. Repairing here keeps the session and history
 * instead.
 */
export function repairState(parsed, defaultSettings) {
  if (!isPlainObject(parsed)) return null;
  const base = freshState(defaultSettings || {});
  const settings = isPlainObject(parsed.settings) ? { ...base.settings, ...parsed.settings } : base.settings;
  if (!Number.isFinite(Number(settings.dailyGoal)) || Number(settings.dailyGoal) < 1) {
    settings.dailyGoal = base.settings.dailyGoal;
  } else {
    settings.dailyGoal = Math.trunc(Number(settings.dailyGoal));
  }
  return {
    ...base,
    ...parsed,
    version: 1,
    customTemplates: Array.isArray(parsed.customTemplates) ? parsed.customTemplates : base.customTemplates,
    deletedDefaultIds: Array.isArray(parsed.deletedDefaultIds) ? parsed.deletedDefaultIds : base.deletedDefaultIds,
    session: isPlainObject(parsed.session) ? parsed.session : null,
    settings,
    introCompleted: parsed.introCompleted === true,
    dailyStats: repairDailyStats(parsed.dailyStats),
    adhkarProgress: isPlainObject(parsed.adhkarProgress) ? parsed.adhkarProgress : {},
    salahProgress: isPlainObject(parsed.salahProgress) ? parsed.salahProgress : {}
  };
}

export function loadState(defaultSettings) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Valid JSON that isn't an object is not repairable, and must take the
    // corrupt-data path (below) so the original is preserved for recovery.
    if (!isPlainObject(parsed)) throw new Error("bad shape");
    return repairState(parsed, defaultSettings);
  } catch (e) {
    try {
      localStorage.setItem(STORAGE_KEY + "_corrupt_backup", localStorage.getItem(STORAGE_KEY) || "");
    } catch (_) {
      /* ignore */
    }
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("Failed to save dhikr state", e);
    return false;
  }
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
