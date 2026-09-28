/**
 * Pure counter logic, kept separate from React/UI so it can be unit tested
 * without rendering anything.
 */

export function effectiveMaxFor(session, item) {
  // Either side can be absent: a session whose `currentItemIndex` no longer
  // resolves (the template was edited or replaced underneath it) arrives without
  // an item, and callers can reach this with no session at all. Fall back to the
  // last recorded repetition so they get a usable number instead of a TypeError
  // thrown from inside a render.
  if (!session || !item) {
    return session && Number.isFinite(session.currentCount) ? session.currentCount : 0;
  }
  return (session.customMax && session.customMax[item.id]) || item.count;
}

/**
 * Applies a single tap to a session for the given template.
 * Never mutates the inputs; returns a new session object.
 * Never increments past the effective maximum for the current item.
 */
export function applyTap(template, session) {
  if (!template || !session || session.completed) return session;
  // Nothing to count against: the session points at an item the template no
  // longer has. Leave it alone rather than dereferencing undefined.
  if (!template.items[session.currentItemIndex]) return session;

  const item = template.items[session.currentItemIndex];
  const effMax = effectiveMaxFor(session, item);
  const newCount = Math.min(session.currentCount + 1, effMax);

  if (newCount >= effMax) {
    const completedItems = [...session.completedItems, item.id];
    const hasNext = session.currentItemIndex + 1 < template.items.length;
    if (hasNext) {
      return {
        ...session,
        currentCount: 0,
        currentItemIndex: session.currentItemIndex + 1,
        completedItems,
        updatedAt: Date.now()
      };
    }
    return {
      ...session,
      currentCount: newCount,
      completedItems,
      completed: true,
      updatedAt: Date.now()
    };
  }

  return { ...session, currentCount: newCount, updatedAt: Date.now() };
}

export function resetSession(session) {
  return {
    ...session,
    currentItemIndex: 0,
    currentCount: 0,
    completedItems: [],
    completed: false,
    startedAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function setCustomMax(session, itemId, newMax) {
  const cm = session.customMax ? { ...session.customMax } : {};
  cm[itemId] = newMax;
  return { ...session, customMax: cm, updatedAt: Date.now() };
}

export function isValidMaxCount(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 10000;
}

/**
 * Brings a session back inside its template after the template changed shape
 * underneath it — a custom template edited (or a backup imported) while a
 * session pointed into it. `currentItemIndex` is clamped into range and the
 * partially-counted item restarts, because the old count belonged to a line
 * that no longer exists. Returns the session untouched when it already fits.
 */
export function clampSessionToTemplate(template, session) {
  if (!session || !template) return session;
  const n = Array.isArray(template.items) ? template.items.length : 0;
  if (n === 0) {
    return { ...session, currentItemIndex: 0, currentCount: 0, completed: false, completedItems: [] };
  }
  const raw = Number(session.currentItemIndex);
  const idx = Math.min(Math.max(0, Number.isFinite(raw) ? Math.trunc(raw) : 0), n - 1);
  if (idx === session.currentItemIndex) return session;
  return { ...session, currentItemIndex: idx, currentCount: 0, completed: false };
}
