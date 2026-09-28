import { describe, it, expect } from "vitest";
import { navIntent, NAV_INTENT } from "../navLogic.js";

// The six items in the nav rail (App.jsx `navItems`).
const ITEMS = ["counter", "adhkar", "prayers", "progress", "achievements", "settings"];

describe("navIntent", () => {
  it("navigates when tapping a different page", () => {
    for (const target of ITEMS) {
      const other = ITEMS.find((v) => v !== target);
      expect(navIntent(target, other)).toEqual({ type: NAV_INTENT.NAVIGATE, to: target });
    }
  });

  it("taps every non-counter item from every other page", () => {
    // Full cross-product, so no single pair is left untested.
    for (const target of ITEMS) {
      for (const current of ITEMS) {
        if (target === current) continue;
        expect(navIntent(target, current).type).toBe(NAV_INTENT.NAVIGATE);
      }
    }
  });

  it("treats tapping the active non-counter item as a no-op", () => {
    // The regression: these used to return to "counter", so tapping Prayer
    // Times while on Prayer Times threw the user back to the counter.
    for (const view of ["adhkar", "prayers", "progress", "achievements", "settings"]) {
      expect(navIntent(view, view)).toEqual({ type: NAV_INTENT.NONE, to: view });
    }
  });

  it("never navigates away from the current page on a re-tap", () => {
    // Guards the specific harm: the outcome must not mention another page.
    for (const view of ITEMS) {
      const intent = navIntent(view, view);
      if (intent.type === NAV_INTENT.TOGGLE_CLEAN) {
        expect(intent.to).toBe("counter");
      } else {
        expect(intent.to).toBe(view);
      }
    }
  });

  it("uses Home to toggle clean mode when already on the counter", () => {
    expect(navIntent("counter", "counter")).toEqual({ type: NAV_INTENT.TOGGLE_CLEAN, to: "counter" });
  });

  it("treats Home as an ordinary navigation from any other page", () => {
    for (const current of ITEMS.filter((v) => v !== "counter")) {
      expect(navIntent("counter", current)).toEqual({ type: NAV_INTENT.NAVIGATE, to: "counter" });
    }
  });

  it("always reports the tapped item as the target", () => {
    for (const target of ITEMS) {
      for (const current of ITEMS) {
        expect(navIntent(target, current).to).toBe(target);
      }
    }
  });

  it("only ever produces the three known intents", () => {
    const allowed = new Set(Object.values(NAV_INTENT));
    for (const target of ITEMS) {
      for (const current of ITEMS) {
        expect(allowed.has(navIntent(target, current).type)).toBe(true);
      }
    }
  });
});
