/**
 * Computes lifetime stats and achievement badges from app state.
 * Everything is derived from dailyStats + customTemplates — no extra storage.
 */
export function computeLifetimeStats(dailyStats) {
  let totalReps = 0;
  let totalSessions = 0;
  let activeDays = 0;
  for (const key of Object.keys(dailyStats || {})) {
    const s = dailyStats[key] || {};
    if (s.repetitions > 0) activeDays++;
    totalReps += s.repetitions || 0;
    totalSessions += s.sessions || 0;
  }
  return { totalReps, totalSessions, activeDays };
}

/** Best streak of consecutive days with at least 1 repetition */
export function computeBestStreak(dailyStats) {
  const keys = Object.keys(dailyStats || {})
    .filter((k) => (dailyStats[k] || {}).repetitions > 0)
    .sort();
  let best = 0;
  let current = 0;
  let prev = null;
  for (const key of keys) {
    const d = new Date(key + "T00:00:00");
    if (prev && (d - prev) / 86400000 === 1) current++;
    else current = 1;
    if (current > best) best = current;
    prev = d;
  }
  return best;
}

/** Current streak up to today (yesterday counts if today not yet done) */
export function computeCurrentStreak(dailyStats) {
  const has = (d) => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return (dailyStats[key] || {}).repetitions > 0;
  };
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  if (!has(day)) day.setDate(day.getDate() - 1); // today not done yet — start from yesterday
  let streak = 0;
  while (has(day)) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

const BADGES = [
  { id: "first-rep",   emoji: "🌱", metric: "totalReps",    targets: [1, 100, 1000, 10000], title: "First Step",   titleKey: "ach_firstStep" },
  { id: "streak",      emoji: "🔥", metric: "currentStreak", targets: [3, 7, 30, 100],      title: "Consistency", titleKey: "ach_consistency" },
  { id: "active-days", emoji: "📅", metric: "activeDays",   targets: [5, 20, 50, 100],     title: "Regularity",  titleKey: "ach_regularity" },
  { id: "sessions",    emoji: "📿", metric: "totalSessions", targets: [5, 25, 100, 500],   title: "Devotion",    titleKey: "ach_devotion" },
  { id: "creator",     emoji: "✨", metric: "templates",    targets: [1, 3, 10],           title: "Creator",     titleKey: "ach_creator" }
];

/**
 * Returns badge rows: one per badge group, with the highest unlocked tier.
 */
export function computeAchievements(state) {
  const stats = computeLifetimeStats(state.dailyStats);
  const metrics = {
    ...stats,
    currentStreak: computeCurrentStreak(state.dailyStats),
    templates: (state.customTemplates || []).length
  };
  return BADGES.map((badge) => {
    const value = metrics[badge.metric] || 0;
    let tier = 0;
    for (const target of badge.targets) if (value >= target) tier++;
    const next = tier < badge.targets.length ? badge.targets[tier] : null;
    return {
      id: badge.id,
      emoji: badge.emoji,
      title: badge.title,
      titleKey: badge.titleKey,
      tier,
      maxTier: badge.targets.length,
      unlocked: tier > 0,
      value,
      next,
      progress: next ? Math.min(value / next, 1) : 1
    };
  });
}