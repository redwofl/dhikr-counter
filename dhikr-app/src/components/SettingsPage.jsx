import { useState, useRef, useEffect } from "react";
import Icon from "../lib/Icon.jsx";
import ScreenHeader from "./ScreenHeader.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { playTapSound, vibrate, forceUnlockAudio } from "../lib/sound.js";
import { PALETTES } from "./TasbihBeads.jsx";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";

const BANNER_AD_ID = "ca-app-pub-3333666454328224/3386410300";

// The native plugin only prepares its banner container inside AdMob.initialize().
// Calling showBanner() first throws a NullPointerException on the UI thread, which
// kills the app and cannot be caught from JS — so initialise once per session and
// never show a banner until that initialisation has actually succeeded.
let admobReadyPromise = null;
function ensureAdMobReady() {
  if (!admobReadyPromise) {
    admobReadyPromise = AdMob.initialize().then(
      () => true,
      () => false
    );
  }
  return admobReadyPromise;
}

function ToggleRow({ label, sub, value, onChange, icon }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--beige)]/60 dark:border-white/10 last:border-0">
      <div className="flex items-center gap-3">
        {icon && <span className="text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{icon}</span>}
        <div>
          <p className="text-[var(--brown-900)] dark:text-[var(--dark-text)] font-medium text-sm">{label}</p>
          {sub && <p className="text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{sub}</p>}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`w-11 h-6 shrink-0 rounded-full transition-all duration-300 ease-in-out relative overflow-hidden ${
          value ? "bg-[var(--terra-dark)]" : "bg-[var(--beige)] dark:bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
          style={{ left: "2px" }}
        />
      </button>
    </div>
  );
}

function NavRow({ label, icon, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-4 border-b border-[var(--beige)]/60 dark:border-white/10 last:border-0 active:opacity-60">
      <span className="flex items-center gap-3 text-sm font-medium text-[var(--brown-900)] dark:text-[var(--dark-text)]">
        <span className="text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{icon}</span>
        {label}
      </span>
      <span className="text-[var(--brown-400)] dark:text-[var(--dark-muted)]">
        <Icon name="chevronRight" size={16} />
      </span>
    </button>
  );
}

export default function SettingsPage({ settings, updateSettings, t, onResetAll, onBack, onProgress, onPrivacy, onExport, onImport, onToast }) {
  const [showResetAll, setShowResetAll] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const importFileRef = useRef(null);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  useEffect(() => {
    let disposed = false;
    let showPromise = null;
    ensureAdMobReady().then((ready) => {
      if (disposed || !ready) return;
      showPromise = AdMob.showBanner({ adId: BANNER_AD_ID, position: "BOTTOM_CENTER" });
      showPromise.catch(() => {});
    });
    return () => {
      disposed = true;
      if (!showPromise) return;
      // Only hide once showBanner has actually settled. Calling hideBanner()
      // unconditionally made the plugin log "You tried to hide a banner that
      // was never shown" from the plugin error channel on every page exit.
      showPromise.then(() => AdMob.hideBanner().catch(() => {}));
    };
  }, []);

  return (
    <div className="min-h-screen pattern-bg safe-top pb-10 -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
      <div className="max-w-[330px] ms-auto me-4 px-4">
        <ScreenHeader title={t.settings} onBack={onBack} t={t} />
        <div className="px-0 pt-1">
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 px-5 mb-5">
            <NavRow label={t.progress} icon={<Icon name="chart" size={17} />} onClick={onProgress} />
            <NavRow label={t.privacyPolicy} icon={<Icon name="shield" size={17} />} onClick={onPrivacy} />
          </div>

          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 px-5 mb-5">
            <ToggleRow label={t.haptic} sub={t.hapticSub} icon={<Icon name="vibrate" size={17} />} value={settings.vibration} onChange={(v) => updateSettings({ vibration: v })} />
            <ToggleRow label={t.sound} sub={t.soundSub} icon={<Icon name="volume" size={17} />} value={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
            <ToggleRow label={t.autoSave} sub={t.autoSaveSub} value={settings.autoSave} onChange={(v) => updateSettings({ autoSave: v })} />
          </div>

          {/* Notifications */}
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 px-5 mb-5">
            <ToggleRow
              label={t.weeklySummary || "Weekly Summary"}
              sub={t.weeklySummarySub}
              icon={<Icon name="chart" size={17} />}
              value={!!settings.weeklySummary}
              onChange={async (v) => {
                if (!v) {
                  updateSettings({ weeklySummary: false });
                  await LocalNotifications.cancel({ notifications: [{ id: 2 }] }).catch(() => {});
                  return;
                }
                try {
                  const perm = await LocalNotifications.requestPermissions();
                  if (perm.display !== "granted") {
                    onToast && onToast(t.reminderBlocked);
                    return;
                  }
                  updateSettings({ weeklySummary: true });
                } catch (e) {
                  onToast && onToast(t.reminderBlocked);
                }
              }}
            />
            <ToggleRow
              label={t.dailyReminder}
              sub={t.dailyReminderSub}
              icon={<Icon name="bell" size={17} />}
              value={!!settings.reminderEnabled}
              onChange={async (v) => {
                if (!v) {
                  updateSettings({ reminderEnabled: false });
                  await LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
                  return;
                }
                try {
                  const perm = await LocalNotifications.requestPermissions();
                  if (perm.display !== "granted") {
                    onToast && onToast(t.reminderBlocked);
                    return;
                  }
                  if (Capacitor.isNativePlatform()) {
                    try {
                      const exact = await LocalNotifications.checkExactNotificationSetting();
                      if (exact.exact_alarm !== "granted") {
                        await LocalNotifications.changeExactNotificationSetting();
                      }
                    } catch (e) {
                      // Exact-alarm access is optional; the reminder still gets scheduled.
                    }
                  }
                  updateSettings({ reminderEnabled: true });
                } catch (e) {
                  onToast && onToast(t.reminderBlocked);
                }
              }}
            />
            {settings.reminderEnabled && (
              <div className="flex items-center justify-between py-4">
                <span className="text-sm font-medium text-[var(--brown-900)] dark:text-[var(--dark-text)]">{t.reminderTime}</span>
                <input
                  type="time"
                  value={settings.reminderTime || "08:00"}
                  onChange={(e) => updateSettings({ reminderTime: e.target.value })}
                  className="rounded-xl border border-[var(--beige)] dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-sm text-[var(--brown-900)] dark:text-[var(--dark-text)]"
                />
              </div>
            )}
          </div>

          {/* Tap sound style picker — horizontal scroll like bead color */}
          <p className="text-xs uppercase tracking-wide text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-2 mt-6">{t.tapSound}</p>
          <div className="flex gap-3 overflow-x-auto pt-3 pb-3 mb-5 -mx-1 px-1 scrollbar-hide snap-x" role="list" aria-label={t.tapSound}>
            {[
              { id: "wood" },
              { id: "chime" },
              { id: "crystal" },
              { id: "pop" },
              { id: "misbaha" },
              { id: "minbar" },
              { id: "tasbih" },
              { id: "adhan" },
              { id: "quran" },
            ].map(({ id: snd }, index) => {
              const colors = {
                wood: "radial-gradient(circle at 35% 30%, #8B6914, #5D4E1A)",
                chime: "radial-gradient(circle at 35% 30%, #FFD700, #B8860B)",
                crystal: "radial-gradient(circle at 35% 30%, #E6E6FA, #9370DB)",
                pop: "radial-gradient(circle at 35% 30%, #FF6B6B, #FF4444)",
                misbaha: "radial-gradient(circle at 35% 30%, #8B4513, #5D2E0C)",
                minbar: "radial-gradient(circle at 35% 30%, #8B7355, #6B5B45)",
                tasbih: "radial-gradient(circle at 35% 30%, #D2691E, #8B4513)",
                adhan: "radial-gradient(circle at 35% 30%, #2E8B57, #1E5C35)",
                quran: "radial-gradient(circle at 35% 30%, #4682B4, #2E5C8A)",
              };
              const isActive = settings.sound && settings.soundType === snd;
              const handleClick = async () => {
                if (!settings.sound) return;
                if (settings.vibration) vibrate(30);
                updateSettings({ soundType: snd });
                try {
                  await forceUnlockAudio();
                  playTapSound(snd);
                } catch (e) {
                  // Sound preview failed silently
                }
              };
              return (
                <button
                  key={snd}
                  role="listitem"
                  aria-label={t["sound_" + snd]}
                  aria-selected={isActive}
                  onClick={handleClick}
                  disabled={!settings.sound}
                  className={`relative flex-none snap-start flex flex-col items-center gap-1 ${animateIn ? "animate-slide-in-right" : ""} delay-${index + 1}`}
                >
                  <span
                    className={`block w-9 h-9 rounded-full transition-all flex items-center justify-center text-2xl relative ${
                      isActive
                        ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[var(--dark-bg)] ring-[var(--terra-dark)] scale-110 ${animateIn ? "animate-slide-to-active" : ""}`
                        : "ring-1 ring-black/5 hover:scale-105"
                    }`}
                    style={{
                      background: colors[snd],
                    }}
                  >
                    <Icon name={snd === "chime" ? "bell" : snd} size={18} strokeWidth={1.6} className="text-white/95" />
                    {isActive && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--terra-dark)] text-white text-[8px] flex items-center justify-center leading-none pointer-events-none z-10">
                        ✓
                      </span>
                    )}
                  </span>
                  <span className={`text-[9px] leading-tight text-center ${isActive ? "text-[var(--terra-dark)] dark:text-[var(--gold)] font-semibold" : "text-[var(--brown-500)] dark:text-[var(--dark-muted)]"} w-14 truncate capitalize`}>
                    {t["sound_" + snd]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bead color palette picker — horizontal scroll with snap */}
          <div className="flex items-center justify-between mt-6 mb-1">
            <p className="text-xs uppercase tracking-wide text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{t.beadColor || "Bead Color"}</p>
            <span className="text-[10px] text-[var(--brown-400)] dark:text-[var(--dark-muted)]/70 truncate max-w-[120px]">
              {PALETTES[settings.beadPalette || "rosewoodCopper"]?.name || ""}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pt-3 pb-3 mb-5 -mx-1 px-1 scrollbar-hide snap-x" role="list" aria-label={t.beadColor || "Bead Color"}>
            {Object.entries(PALETTES).map(([key, pal], index) => {
              const isActive = (settings.beadPalette || "rosewoodCopper") === key;
              const delayClass = `delay-${index + 1}`;
              return (
                <button
                  key={key}
                  role="listitem"
                  aria-label={pal.name}
                  aria-selected={isActive}
                  onClick={() => updateSettings({ beadPalette: key })}
                  className={`flex-none snap-start flex flex-col items-center gap-1 ${animateIn ? "animate-slide-in-right" : ""} ${delayClass}`}
                >
                  <span
                    className={`block w-9 h-9 rounded-full transition-all ${
                      isActive
                        ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[var(--dark-bg)] ring-[var(--terra-dark)] scale-110 animate-slide-to-active"
                        : "ring-1 ring-black/5 hover:scale-105"
                      }`}
                    style={{
                      background: pal.perBeadHue
                        ? "conic-gradient(from 180deg, hsl(0,78%,56%), hsl(55,78%,56%), hsl(110,78%,56%), hsl(165,78%,56%), hsl(220,78%,56%), hsl(275,78%,56%), hsl(330,78%,56%), hsl(0,78%,56%))"
                        : `radial-gradient(circle at 35% 30%, ${pal.activeGradient[0].color}, ${pal.activeGradient[2].color})`,
                      boxShadow: isActive ? `0 0 0 2px ${pal.ringStroke}` : undefined,
                    }}
                  />
                  <span className={`text-[9px] leading-tight text-center ${isActive ? "text-[var(--terra-dark)] dark:text-[var(--gold)] font-semibold" : "text-[var(--brown-500)] dark:text-[var(--dark-muted)]"} w-14 truncate`}>
                    {pal.name.split(" & ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs uppercase tracking-wide text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-2 mt-6">{t.theme}</p>
          <div className="flex flex-wrap gap-2 pt-2 pb-2" role="list" aria-label={t.theme}>
            {["system", "light", "dark"].map((th, index) => {
              const isActive = settings.theme === th;
              const delayClass = `delay-${index + 1}`;
              return (
                <button
                  key={th}
                  role="listitem"
                  aria-selected={isActive}
                  onClick={() => updateSettings({ theme: th })}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-5 rounded-xl text-sm font-medium capitalize transition-all ${animateIn && !isActive ? "animate-slide-in-right" : ""} ${delayClass} ${
                    isActive
                      ? "bg-white/70 dark:bg-white/10 scale-105 animate-slide-to-active"
                      : "bg-white/70 dark:bg-white/10 hover:scale-105"
                    }`}
                >
                  <span className={`leading-tight text-center ${isActive ? "text-[var(--terra-dark)] dark:text-[var(--gold)] font-semibold" : "text-[var(--brown-500)] dark:text-[var(--dark-muted)]"}`}>{t["theme_" + th]}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs uppercase tracking-wide text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-2">{t.language}</p>
          <div className="flex flex-wrap gap-2 pt-2 pb-2 mb-8" role="list" aria-label={t.language}>
            {[
              ["en", "English", ""],
              ["ar", "العربية", "Arabic"],
              ["tr", "Türkçe", "Turkish"],
              ["ur", "اردو", "Urdu"],
              ["id", "Indonesia", "Indonesian", true]
            ].map(([code, label, englishName, big]) => {
              const isActive = settings.language === code;
              return (
                <button
                  key={code}
                  role="listitem"
                  aria-selected={isActive}
                  onClick={() => {
                    updateSettings({ language: code });
                    document.documentElement.lang = code;
                  }}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl text-sm font-medium bg-white/70 dark:bg-white/10 transition-colors ${
                    big ? "py-3.5 px-6" : "py-2.5 px-4"
                  } ${isActive ? "scale-105" : "hover:scale-105"}`}
                >
                  <span dir="auto" className={`leading-tight text-center ${isActive ? "text-[var(--terra-dark)] dark:text-[var(--gold)] font-semibold" : "text-[var(--brown-500)] dark:text-[var(--dark-muted)]"}`}>{label}</span>
                  {englishName && <span className="text-[10px] uppercase tracking-wide opacity-75 leading-tight">{englishName}</span>}
                </button>
              );
            })}
          </div>

          {/* Backup / restore */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={onExport}
              className="flex-1 py-3 rounded-2xl border border-[var(--beige)] dark:border-white/10 text-[var(--brown-700)] dark:text-[var(--dark-muted)] font-medium active:scale-95"
            >
              {t.exportData}
            </button>
            <button
              onClick={() => importFileRef.current && importFileRef.current.click()}
              className="flex-1 py-3 rounded-2xl border border-[var(--beige)] dark:border-white/10 text-[var(--brown-700)] dark:text-[var(--dark-muted)] font-medium active:scale-95"
            >
              {t.importData}
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (file) onImport(file);
                e.target.value = "";
              }}
            />
          </div>

          <button onClick={() => setShowResetAll(true)} className="w-full py-3 rounded-2xl border border-red-300 dark:border-red-400/50 text-red-500 dark:text-red-400 font-medium active:scale-95 mb-3">
            {t.resetAllData}
          </button>
          <p className="text-xs text-center text-[var(--brown-500)]/70 dark:text-[var(--dark-muted)]/70">{t.savedLocallyNote}</p>

          <ConfirmDialog
            open={showResetAll}
            title={t.resetAllData}
            message={t.resetAllMessage}
            confirmLabel={t.resetAllData}
            t={t}
            danger
            onCancel={() => setShowResetAll(false)}
            onConfirm={() => {
              onResetAll();
              setShowResetAll(false);
            }}
          />
          <div className="mt-4 h-[50px]" id="admob-banner" />
        </div>
      </div>
    </div>
  );
}
