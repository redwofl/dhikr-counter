export const STORAGE_KEY = "dhikr_app_v1";

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

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("bad shape");
    return parsed;
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
