/**
 * Pure counter logic, kept separate from React/UI so it can be unit tested
 * without rendering anything.
 */

export function effectiveMaxFor(session, item) {
  return (session.customMax && session.customMax[item.id]) || item.count;
}

/**
 * Applies a single tap to a session for the given template.
 * Never mutates the inputs; returns a new session object.
 * Never increments past the effective maximum for the current item.
 */
export function applyTap(template, session) {
  if (!template || !session || session.completed) return session;

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
