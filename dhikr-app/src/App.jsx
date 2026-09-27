import { useEffect, useMemo, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { DEFAULT_TEMPLATES, DEFAULT_SETTINGS, newSession, localizeDefaultTemplate } from "./data/templates.js";
import { TRANSLATIONS } from "./data/translations.js";
import { Capacitor } from "@capacitor/core";
import { loadState, saveState, freshState, todayKey, STORAGE_KEY } from "./lib/storage.js";
import { nextDailyAt, nextWeeklyAt, weekKeyOf, weekStats, weeklyBody, weeklySummaryAction } from "./lib/notifications.js";
import { unlockAudioOnFirstInteraction } from "./lib/sound.js";
import { addTemplate, updateTemplate, removeTemplate, isCustomTemplateId } from "./lib/templateOps.js";
import { isTodayGoalComplete, computeStreak, remainingToGoal, getTodayRepetitions } from "./lib/dailyGoal.js";

// localStorage marker recording the week whose recap was already armed/handled
const WEEKLY_KEY = "dhikr_weekly_last";

import IntroScreen from "./components/IntroScreen.jsx";
import CounterPage from "./components/CounterPage.jsx";
import TemplatesPage from "./components/TemplatesPage.jsx";
import TemplateEditorModal from "./components/TemplateEditorModal.jsx";
import SettingsPage from "./components/SettingsPage.jsx";
import ProgressPage from "./components/ProgressPage.jsx";
import AdhkarPage from "./components/AdhkarPage.jsx";
import AchievementsPage from "./components/AchievementsPage.jsx";
import PrivacyPage from "./components/PrivacyPage.jsx";
import ResumeModal from "./components/ResumeModal.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import Toast from "./components/Toast.jsx";
import NavRail from "./components/NavRail.jsx";
import PrayerTimesPage from "./components/PrayerTimesPage.jsx";

export default function App() {
  const [state, setState] = useState(() => loadState() || freshState(DEFAULT_SETTINGS));
  const [view, setView] = useState("counter");
  const [navExpanded, setNavExpanded] = useState(false);
  // Clean mode: tapping Home while on the counter hides the other nav icons
  // so only the Home icon stays; tapping Home again restores all of them.
  const [navMinimal, setNavMinimal] = useState(false);
  // Generation counter for auto-counter requests. Incrementing it consumes any
  // in-flight tick so a stale navy/timer press can never revive the counter,
  // and stops any "running" state left behind when the counter screen unmounts.
  const [autoCounterGen, setAutoCounterGen] = useState(0);
  const [autoCounterRunning, setAutoCounterRunning] = useState(false);
  // Set when the nav-rail timer button is pressed from a tab other than the
  // counter: CounterPage opens its Auto Counter dialog on arrival and then
  // clears this via onAutoCounterPendingHandled.
  const [autoCounterPending, setAutoCounterPending] = useState(false);
  const resetAutoCounter = () => {
    setAutoCounterGen((g) => g + 1);
    setAutoCounterRunning(false);
    setAutoCounterPending(false);
  };
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };
  // Web-only: bumped whenever the app becomes visible again so the one-shot
  // web reminder is re-armed (browsers only deliver it while the tab runs).
  const [reminderRearmTick, setReminderRearmTick] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  // Which page opened Privacy, so its back button returns there instead of Home
  const [privacyReturnView, setPrivacyReturnView] = useState("counter");
  const initialLoadRef = useRef(true);
  const goalCompletedDateRef = useRef(isTodayGoalComplete(state, state.settings.dailyGoal || 333) ? todayKey() : null);
  const viewRef = useRef(view);
  // Modal visibility mirrored into refs so the (mount-once) hardware back
  // handler can pop the innermost dialog without being re-registered.
  const showResumePromptRef = useRef(false);
  const creatingRef = useRef(false);
  const editingTemplateRef = useRef(null);
  const deleteTargetRef = useRef(null);
  // Live binding to the CounterPage's modal state so the hardware back button
  // can close whichever counter dialog is innermost (reset / max / info / auto).
  const counterModalRef = useRef({ open: false, close: () => {} });
  const remindersScheduledRef = useRef(false);

  useEffect(() => { viewRef.current = view; }, [view]);

  // Keep the back-handler refs in sync with the modal state.
  useEffect(() => { showResumePromptRef.current = showResumePrompt; }, [showResumePrompt]);
  useEffect(() => { creatingRef.current = creating; }, [creating]);
  useEffect(() => { editingTemplateRef.current = editingTemplate; }, [editingTemplate]);
  useEffect(() => { deleteTargetRef.current = deleteTarget; }, [deleteTarget]);

  const t = TRANSLATIONS[state.settings.language] || TRANSLATIONS.en;
  // Layout direction stays LTR for every language (including Urdu/Arabic) so
  // switching the language only changes the words, never shifts the whole UI.

  const dailyGoal = state.settings.dailyGoal || 333;
  const streak = useMemo(() => computeStreak(state, dailyGoal), [state.dailyStats, dailyGoal]);

  // Unlock the AudioContext on the first user gesture so tap sounds work
  useEffect(() => {
    unlockAudioOnFirstInteraction();
  }, []);

  // Android hardware back: pop an open modal first (resume prompt, template
  // editor, delete confirm); only close a sub-page when no modal is showing,
  // and exit the app only from a bare counter screen.
  useEffect(() => {
    let backHandler;
    CapacitorApp.addListener("backButton", () => {
      // 1) Counter-page dialogs (reset / max count / info / auto counter)
      if (counterModalRef.current.open) {
        counterModalRef.current.close();
        return;
      }
      // 2) App-level modals, innermost first
      if (deleteTargetRef.current) {
        setDeleteTarget(null);
        return;
      }
      if (editingTemplateRef.current) {
        setEditingTemplate(null);
        return;
      }
      if (creatingRef.current) {
        setCreating(false);
        return;
      }
      if (showResumePromptRef.current) {
        setShowResumePrompt(false);
        return;
      }
      // 3) Sub-page → counter
      if (viewRef.current !== "counter") {
        setView("counter");
        setNavMinimal(false);
        setNavExpanded(false);
        setCreating(false);
        setEditingTemplate(null);
        setDeleteTarget(null);
        return;
      }
      // 4) Bare counter screen → leave the app
      CapacitorApp.exitApp();
    }).then((h) => {
      backHandler = h;
      // StrictMode mounts, cleans up, then mounts again. The cleanup above runs
      // before this promise settles, so on the first pass `backHandler` is still
      // undefined and the listener survives — leaving two handlers registered
      // so a back press runs the exit logic twice.
      if (backHandler !== h) h.remove();
    }).catch(() => {});
    return () => { if (backHandler) { backHandler.remove(); backHandler = null; } };
  }, []);

  // Daily reminder — Capacitor Local Notifications.
  //
  // Native (Android): a cron-like `on: { hour, minute }` schedule. The plugin
  // computes the next matching wall-clock time and re-arms itself after every
  // fire, so it never drifts. (`repeats: true` + `at` is avoided: the plugin
  // derives the interval from `at - now`, which drifts with every relaunch.)
  //
  // Web: the web implementation only supports `at` and only fires while the
  // tab is open, so a one-shot `at` is used and the effect re-arms it whenever
  // the app regains focus or the reminder time setting changes.
  useEffect(() => {
    const scheduleReminder = async () => {
      if (!state.settings.reminderEnabled) {
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});
        remindersScheduledRef.current = false;
        return;
      }

      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") {
        showToast(t.reminderBlocked);
        setState((s) => ({ ...s, settings: { ...s.settings, reminderEnabled: false } }));
        return;
      }

      await LocalNotifications.cancel({ notifications: [{ id: 1 }] }).catch(() => {});

      if (Capacitor.isNativePlatform()) {
        const [h, m] = (state.settings.reminderTime || "08:00").split(":").map(Number);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1,
              title: t.appName,
              body: t.reminderBody,
              schedule: { on: { hour: h, minute: m }, allowWhileIdle: true },
              sound: undefined,
              attachments: undefined,
              actionTypeId: "",
              extra: null,
            },
          ],
        });
      } else {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1,
              title: t.appName,
              body: t.reminderBody,
              schedule: { at: nextDailyAt(new Date(), state.settings.reminderTime) },
              sound: undefined,
              attachments: undefined,
              actionTypeId: "",
              extra: null,
            },
          ],
        });
      }

      remindersScheduledRef.current = true;
    };

    scheduleReminder();
  }, [state.settings.reminderEnabled, state.settings.reminderTime, t.reminderBody, reminderRearmTick]);

  // Web-only re-arm: the web notification implementation is a plain setTimeout
  // that dies with the tab, so re-schedule whenever the app becomes visible.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") setReminderRearmTick((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Weekly summary — one recap notification at the start of each week.
  //
  // Every open of the app while the toggle is on decides (via
  // weeklySummaryAction) whether this week's recap still needs scheduling:
  //   schedule → arm a one-shot `at` notification for next Monday 09:00 and
  //              record the week key in dhikr_weekly_last
  //   markOnly → the finished week had no dhikr; record the key without a
  //              notification so we don't re-check all week long
  //   skip     → this week's recap is already armed
  //   cancel   → toggle is off; drop any pending notification and the marker
  // Stats are read at arming time for the *previous* 7 days, so the body is
  // always a recap of the week that just ended, never of the coming one.
  useEffect(() => {
    const scheduleWeekly = async () => {
      const enabled = !!state.settings.weeklySummary;
      const weekKey = weekKeyOf(new Date());

      if (!enabled) {
        await LocalNotifications.cancel({ notifications: [{ id: 2 }] }).catch(() => {});
        localStorage.removeItem(WEEKLY_KEY);
        return;
      }

      // Decide first whether anything needs scheduling — the effect also runs on
      // every dailyStats change (a tap), and this avoids requesting notification
      // permission (and re-promising a toast) when this week's recap is already
      // armed or was already marked as handled.
      const stats = weekStats(state.dailyStats, new Date());
      const scheduled = localStorage.getItem(WEEKLY_KEY);
      const action = weeklySummaryAction(true, scheduled ? [scheduled] : [], weekKey, stats);
      if (action.action === "skip") return;

      if (action.action === "markOnly") {
        localStorage.setItem(WEEKLY_KEY, weekKey);
        return;
      }

      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") {
        showToast(t.reminderBlocked);
        setState((s) => ({ ...s, settings: { ...s.settings, weeklySummary: false } }));
        return;
      }

      const triggerDate = nextWeeklyAt(new Date());
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 2 }] }).catch(() => {});

        const body = weeklyBody(
          t.weeklySummaryBody || "This week: {reps} dhikr across {days} day(s) — Streak: {streak} 🔥",
          { repetitions: stats.repetitions, activeDays: stats.activeDays, streak: streak.current }
        );

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 2,
              title: t.appName,
              body,
              schedule: { at: triggerDate },
              sound: undefined,
              attachments: undefined,
              actionTypeId: "",
              extra: null,
            },
          ],
        });

        localStorage.setItem(WEEKLY_KEY, weekKey);
      } catch (e) {
        // Mark the week as handled even if scheduling failed, so the check
        // doesn't re-request permission and re-attempt on every subsequent tap.
        localStorage.setItem(WEEKLY_KEY, weekKey);
      }
    };

    scheduleWeekly();
  }, [state.settings.weeklySummary, state.dailyStats, streak, t.weeklySummaryBody]);

  // Backup: export the full app state as a JSON file
  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dhikr-backup-${todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(t.importFailed);
    }
  };

  // Backup: import a previously exported JSON file
  const handleImport = (file) => {
    file
      .text()
      .then((text) => {
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object" || parsed.version !== 1 || !parsed.settings) {
          throw new Error("bad shape");
        }
        // Reject the whole file if a list field is present but not a list.
        // Spreading it straight into state let a backup carrying
        // `deletedDefaultIds: null` through the check above, and the very next
        // render called `.includes` on it — which dropped the app into the
        // ErrorBoundary with the user's data half-applied.
        for (const field of ["customTemplates", "deletedDefaultIds"]) {
          if (parsed[field] !== undefined && !Array.isArray(parsed[field])) {
            throw new Error("bad shape: " + field);
          }
        }
        if (
          parsed.dailyStats !== undefined &&
          (parsed.dailyStats === null || typeof parsed.dailyStats !== "object" || Array.isArray(parsed.dailyStats))
        ) {
          throw new Error("bad shape: dailyStats");
        }
        setState((s) => ({ ...s, ...parsed }));
        showToast(t.importSuccess);
      })
      .catch(() => showToast(t.importFailed));
  };

  const allTemplates = useMemo(() => {
    const lang = state.settings.language;
    const defaults = DEFAULT_TEMPLATES.filter((d) => !state.deletedDefaultIds.includes(d.id)).map((d) =>
      localizeDefaultTemplate(d, lang)
    );
    return [...defaults, ...state.customTemplates];
  }, [state.customTemplates, state.deletedDefaultIds, state.settings.language]);

  const todayReps = getTodayRepetitions(state);
  const goalRemaining = remainingToGoal(state, dailyGoal);

  useEffect(() => {
    if (state.settings.autoSave !== false) saveState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark) => root.classList.toggle("dark", dark);
    if (state.settings.theme === "dark") apply(true);
    else if (state.settings.theme === "light") apply(false);
    else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches);
      const handler = (e) => apply(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [state.settings.theme]);

  useEffect(() => {
    document.documentElement.dir = "ltr"; // keep the layout LTR for all languages
    document.documentElement.lang = state.settings.language;
  }, [state.settings.language]);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      if (state.introCompleted && state.session && !state.session.completed && state.session.currentCount > 0) {
        setShowResumePrompt(true);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Celebrate when today's daily goal is first reached
  useEffect(() => {
    const today = todayKey();
    if (goalCompletedDateRef.current !== today && isTodayGoalComplete(state, dailyGoal)) {
      goalCompletedDateRef.current = today;
      showToast(t.goalComplete + " ✓");
    }
  }, [state.dailyStats, dailyGoal, t.goalComplete]);

  const updateSettings = (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const setSession = (updater) => setState((s) => ({ ...s, session: typeof updater === "function" ? updater(s.session) : updater }));

  const addRepetitions = (n) => {
    setState((s) => {
      const key = todayKey();
      const prevDay = s.dailyStats[key] || { repetitions: 0, sessions: 0 };
      return { ...s, dailyStats: { ...s.dailyStats, [key]: { ...prevDay, repetitions: prevDay.repetitions + n } } };
    });
  };

  const prevCompletedRef = useRef(!!(state.session && state.session.completed));
  useEffect(() => {
    const nowCompleted = !!(state.session && state.session.completed);
    if (nowCompleted && !prevCompletedRef.current) {
      const key = todayKey();
      setState((s) => {
        const prevDay = s.dailyStats[key] || { repetitions: 0, sessions: 0 };
        return { ...s, dailyStats: { ...s.dailyStats, [key]: { ...prevDay, sessions: prevDay.sessions + 1 } } };
      });
    }
    prevCompletedRef.current = nowCompleted;
  }, [state.session && state.session.completed]); // eslint-disable-line react-hooks/exhaustive-deps

  const startTemplate = (tpl) => {
    setState((s) => ({ ...s, session: newSession(tpl.id) }));
    setView("counter");
  };

  const currentTemplate = state.session ? allTemplates.find((tp) => tp.id === state.session.templateId) : null;

  const handleCreateSave = (tpl) => {
    setState((s) => ({ ...s, customTemplates: addTemplate(s.customTemplates, tpl) }));
    setCreating(false);
    showToast(t.save + " ?");
  };

  const handleEditSave = (tpl) => {
    setState((s) => ({ ...s, customTemplates: updateTemplate(s.customTemplates, tpl) }));
    setEditingTemplate(null);
    showToast(t.save + " ?");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setState((s) => ({
      ...s,
      customTemplates: isCustomTemplateId(deleteTarget.id) ? removeTemplate(s.customTemplates, deleteTarget.id) : s.customTemplates
    }));
    setDeleteTarget(null);
  };

  if (!state.introCompleted) {
    return (
      <IntroScreen
        t={t}
        onStart={() => {
          setState((s) => ({ ...s, introCompleted: true, session: s.session || newSession(DEFAULT_TEMPLATES[0].id) }));
          setView("counter");
        }}
        onExplore={() => {
          setState((s) => ({ ...s, introCompleted: true }));
          setView("templates");
        }}
      />
    );
  }

  const navItems = [
    { view: "counter", icon: "home", label: t.counter || "Counter" },
    { view: "adhkar", icon: "sun", label: t.dailyAdhkar },
    { view: "prayers", icon: "moon", label: t.prayerTimes || "Prayer Times" },
    { view: "progress", icon: "chart", label: t.progress },
    { view: "achievements", icon: "trophy", label: t.achievements || "Achievements" },
    { view: "settings", icon: "settings", label: t.settings }
  ];

  const openPrivacy = (from) => {
    setPrivacyReturnView(from);
    goTo("privacy");
  };

  // Shared page switch: leaves clean mode, collapses the rail and stops the
  // auto counter so the counter screen and its timer never go stale.
  const goTo = (v) => {
    if (v !== "counter") resetAutoCounter();
    setView(v);
    setNavMinimal(false);
    setNavExpanded(false); // collapse back to icon-only so the page gets full width
  };

  const handleNav = (v) => {
    // Tapping Home while already on the counter toggles clean mode: hide the
    // other nav icons so only Home stays, tap Home again to restore all icons.
    // Tapping any other icon always shows the full navigation again.
    if (v === "counter" && view === "counter") {
      setNavExpanded(false);
      setNavMinimal((m) => !m);
      return;
    }
    if (v === view) {
      if (v !== "counter") {
        goTo("counter");
      }
      return;
    }
    goTo(v);
  };

  return (
    <div dir="ltr" className="min-h-screen text-[var(--brown-900)] dark:text-[var(--dark-text)] relative flex flex-col h-screen">
      <NavRail
        items={navItems}
        activeView={view}
        expanded={navExpanded}
        onToggle={() => setNavExpanded((e) => !e)}
        onNavigate={handleNav}
        minimal={navMinimal}
        t={t}
        todayReps={todayReps}
        dailyGoal={dailyGoal}
        timerRunning={autoCounterRunning}
        timerAvailable={!!(currentTemplate && state.session && !state.session.completed)}
        onTimer={() => {
          // The nav-rail timer button works from every tab: on the counter it
          // toggles (stop while running, else open the dialog — or close it when
          // already open); from any other tab it navigates to the counter,
          // which opens the dialog on arrival.
          if (!(currentTemplate && state.session && !state.session.completed)) return;
          if (viewRef.current !== "counter") {
            setAutoCounterPending(true);
            goTo("counter");
            return;
          }
          setAutoCounterGen((g) => g + 1);
        }}
      />
      <div className="w-full min-w-0 ps-[var(--nav-gutter)] flex-1 overflow-y-auto">
      <ResumeModal
        open={showResumePrompt}
        template={currentTemplate}
        session={state.session}
        t={t}
        onStartNew={() => {
          setState((s) => ({ ...s, session: newSession(currentTemplate.id) }));
          setShowResumePrompt(false);
        }}
        onContinue={() => setShowResumePrompt(false)}
      />

          {view === "counter" && (
            <CounterPage
              template={currentTemplate}
              session={state.session}
              setSession={setSession}
              settings={state.settings}
              t={state.settings.language === "ur" ? TRANSLATIONS.en : t}
              onOpenTemplates={() => goTo("templates")}
              onOpenSettings={() => goTo("settings")}
              onOpenAdhkar={() => goTo("adhkar")}
              addRepetitions={addRepetitions}
              dailyGoal={dailyGoal}
              todayReps={todayReps}
              goalRemaining={goalRemaining}
              streak={streak}
              timerTick={autoCounterGen}
              autoCounterPending={autoCounterPending}
              onAutoCounterPendingHandled={() => setAutoCounterPending(false)}
              modalBinding={counterModalRef}
              onAutoRunningChange={setAutoCounterRunning}
            />
          )}
      {view === "templates" && (
        <TemplatesPage
          templates={allTemplates}
          t={t}
          onStart={startTemplate}
          onCreate={() => setCreating(true)}
          onEdit={(tpl) => setEditingTemplate(tpl)}
          onDelete={(tpl) => setDeleteTarget(tpl)}
          onBack={() => goTo("counter")}
          onPrivacy={() => openPrivacy("templates")}
        />
      )}
      {view === "settings" && (
        <SettingsPage
          settings={state.settings}
          updateSettings={updateSettings}
          t={t}
          onBack={() => goTo("counter")}
          onProgress={() => goTo("progress")}
          onPrivacy={() => openPrivacy("settings")}
          onExport={handleExport}
          onImport={handleImport}
          onToast={showToast}
          onResetAll={() => {
            localStorage.removeItem(STORAGE_KEY);
            setState(freshState(DEFAULT_SETTINGS));
          }}
        />
      )}
      {view === "progress" && (
        <ProgressPage
          dailyStats={state.dailyStats}
          session={state.session}
          template={currentTemplate}
          t={t}
          onBack={() => goTo("settings")}
          onAchievements={() => goTo("achievements")}
          dailyGoal={dailyGoal}
          todayReps={todayReps}
          streak={streak}
        />
      )}
      {view === "achievements" && (
        <AchievementsPage state={state} t={t} onBack={() => goTo("progress")} />
      )}
      {view === "adhkar" && (
        <AdhkarPage
          t={t}
          settings={state.settings}
          onBack={() => goTo("counter")}
          adhkarProgress={state.adhkarProgress}
          setAdhkarProgress={(updater) =>
            setState((s) => ({
              ...s,
              adhkarProgress: typeof updater === "function" ? updater(s.adhkarProgress || {}) : updater
            }))
          }
          salahProgress={state.salahProgress}
          setSalahProgress={(updater) =>
            setState((s) => ({
              ...s,
              salahProgress: typeof updater === "function" ? updater(s.salahProgress || {}) : updater
            }))
          }
        />
      )}
      {view === "privacy" && <PrivacyPage t={t} onBack={() => goTo(privacyReturnView)} />}
      {view === "prayers" && <PrayerTimesPage t={t} onBack={() => goTo("counter")} />}

      <TemplateEditorModal open={creating} initial={null} onClose={() => setCreating(false)} onSave={handleCreateSave} t={t} />
      <TemplateEditorModal open={!!editingTemplate} initial={editingTemplate} onClose={() => setEditingTemplate(null)} onSave={handleEditSave} t={t} />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t.delete + "?"}
        message={deleteTarget ? `${t.delete} "${deleteTarget.name}"?` : ""}
        confirmLabel={t.delete}
        t={t}
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <Toast toast={toast} />
      </div>
    </div>
  );
}



