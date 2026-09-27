# Dhikr Counter

A peaceful, mobile-first Dhikr / Tasbih / Misbaha counter built with React,
Vite, and Tailwind CSS. No account or backend required — everything is
saved locally in the browser.

## Features

- Tap-to-count with automatic progression through multi-line dhikr templates
  (e.g. Subhan Allah → Alhamdulillah → Allahu Akbar, 33x each)
- Built-in templates: Tasbih/Tahmid/Takbir, Istighfar, Salawat, and more
- Create, edit, delete, and search custom dhikr templates
- Per-dhikr custom max count (slider + presets: 33x / 100x / 1000x)
- Auto Counter — tap 3 times to "teach" your pace, or set a fixed timer
  interval, and let the app count for you
- Progress is saved automatically after every tap and resumes where you
  left off, with a "Continue your Dhikr?" prompt on reload
- Daily progress tracking (repetitions and completed sessions per day)
- Dark mode (system / light / dark), Arabic language with full RTL layout
- Haptic feedback and tap sounds (both optional, both gracefully degrade
  on unsupported browsers)
- Installable as a PWA with offline support for the core counting flow
- Accessible: semantic markup, ARIA labels, visible focus states,
  reduced-motion support

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Building for production

```bash
npm run build
npm run preview   # optional: preview the production build locally
```

The production build is written to `dist/`. Deploy that folder to any
static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, an S3
bucket, etc.) — no server-side code is required.

## Running tests

```bash
npm test
```

Tests cover the pure counter logic (increment, reset, max-count
enforcement, item completion, final completion), template operations
(create/update/remove/search/validate), and local persistence
(save/reload/corrupt-data recovery).

## How local persistence works

All app data — templates, the active session, settings, and daily
progress stats — is stored under a single versioned key
(`dhikr_app_v1`) in the browser's `localStorage`. See
`src/lib/storage.js`. If the stored JSON is ever corrupted, the app
backs it up under `dhikr_app_v1_corrupt_backup` and starts fresh
rather than crashing.

## Where templates are defined

Built-in templates live in `src/data/templates.js`
(`DEFAULT_TEMPLATES`). Custom templates created in the app are stored
separately in `state.customTemplates` and persisted the same way.
Template CRUD/search helpers are pure functions in
`src/lib/templateOps.js`, and the tap/reset/max-count logic is in
`src/lib/counterLogic.js` — both are unit tested and have no React
dependency, so they're easy to reuse if you add a backend later.

## Adding Supabase later

The app currently works fully offline with no account. To add optional
cloud sync:

1. `npm install @supabase/supabase-js`
2. Create a `src/lib/supabaseClient.js` that exports a configured client
   using `import.meta.env.VITE_SUPABASE_URL` and
   `import.meta.env.VITE_SUPABASE_ANON_KEY` (add these to a `.env.local`
   file — never commit real keys).
3. Add tables mirroring the shapes in `src/data/templates.js` (templates,
   sessions, daily_stats) with a `user_id` column.
4. In `src/App.jsx`, mirror writes made through `saveState()` /
   `loadState()` (see `src/lib/storage.js`) to Supabase behind an
   "account connected" check, so the app keeps working fully offline
   when no account is configured.

## Configuring the PWA

PWA support is provided by `vite-plugin-pwa`, configured in
`vite.config.js`. The manifest (name, colors, icons) also has a static
copy at `public/manifest.json` for reference. To customize:

- Edit the `manifest` block in `vite.config.js` (name, theme colors,
  icons)
- Replace `public/icon.svg` with your own icon
- Adjust `workbox.globPatterns` in `vite.config.js` to control what gets
  precached for offline use

After `npm run build`, the build output in `dist/` includes the
generated service worker and manifest.

## Project structure

```
src/
  components/     UI components (CounterPage, TemplatesPage, modals, etc.)
  data/           Default templates and UI translations (en/ar)
  lib/            Pure logic + utilities: counterLogic, templateOps,
                  storage, sound, Icon
  App.jsx         Top-level state and view routing
  main.jsx        React entry point
```

## Notes

- Built with plain JavaScript + JSX (not TypeScript) to keep the
  dependency surface small; the code is structured so migrating to
  TypeScript later is mostly a matter of adding `.ts`/`.tsx` extensions
  and type annotations — the logic is already isolated into small, pure
  modules.
- Tailwind is configured with the same warm cream/terracotta palette
  used throughout the UI (see `tailwind.config.js` and
  `src/index.css`).
