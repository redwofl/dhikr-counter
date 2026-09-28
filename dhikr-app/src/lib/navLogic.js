// Navigation-rail intent, extracted from App.jsx so it can be tested without
// mounting the whole app.
//
// The rail has two special cases and one rule:
//
//   1. `counter` (Home) doubles as the clean-mode toggle. Home is the only icon
//      that survives in clean mode, so tapping it while already on the counter
//      has to bring the rest of the rail back. Tapping it from another page is
//      an ordinary navigation.
//
//   2. Tapping an item that is already the current page is a no-op.
//
//   3. Anything else navigates.

export const NAV_INTENT = {
  /** Already on the requested page — change nothing. */
  NONE: "none",
  /** Move to a different page. */
  NAVIGATE: "navigate",
  /** Home tapped while already on the counter — flip clean mode. */
  TOGGLE_CLEAN: "toggleCleanMode",
};

/**
 * Decide what tapping `target` in the nav rail should do.
 *
 * @param {string} target   the view id of the tapped item
 * @param {string} current  the view id currently on screen
 * @returns {{ type: string, to: string }}
 *
 * Rule 2 is a fix. The code used to be:
 *
 *     if (v === "counter" && view === "counter") { toggleCleanMode(); return }
 *     if (v === view) { if (v !== "counter") goTo("counter"); return }
 *     goTo(v)
 *
 * which read "tapping the current section again goes back to the counter" as a
 * feature. In practice it lost the user's place: tapping Prayer Times while
 * already on Prayer Times threw them onto the counter, and so did the same tap
 * on Progress or Settings — three of the six nav items. Confirmed on device
 * before the change; the active item now stays put.
 */
export function navIntent(target, current) {
  if (target === current) {
    if (target === "counter") {
      return { type: NAV_INTENT.TOGGLE_CLEAN, to: target };
    }
    return { type: NAV_INTENT.NONE, to: target };
  }
  return { type: NAV_INTENT.NAVIGATE, to: target };
}
