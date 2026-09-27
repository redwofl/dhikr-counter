# Play Store Release — Dhikr Counter v1.1

**Package:** `app.dhikr.counter`
**Version:** 1.1 (versionCode 2)
**Signing:** `dhikr-release.keystore`, alias `dhikr` (SHA-1: `8945A27398AA0C2FAA4CCAEC5F6D1494679CFFB0`)

## Artifacts

| File | Use |
|---|---|
| `DhikrCounter-v1.1-playstore.aab` | Upload to Play Console (App bundles — required for new apps) |
| `DhikrCounter-v1.1-release.apk` | Direct sideload / testing on devices |

Both are signed with the release keystore. **Never lose `dhikr-release.keystore`** — Google Play requires every update to be signed with the same key. Back it up somewhere safe (password manager / private storage). Its passwords are in `dhikr-app/android/key.properties`.

## Play Console steps

1. https://play.google.com/console → Create app → name "Dhikr Counter", default language, App (not game), Free.
2. **Testing → Internal testing** (recommended first): create a release, upload the `.aab`, add tester emails.
3. Complete: App content (privacy policy, ads declaration, data safety, content ratings, target audience).
4. **Production → Create new release** → upload the `.aab` → roll out.

## Play Console declarations

- **Contains ads:** YES (AdMob ads are integrated via `@capacitor-community/admob`).
- **Content rating questionnaire:** No violence, no user-generated content, no gambling → rated Everyone.

## Data safety form (answers based on current code)

| Question | Answer | Why |
|---|---|---|
| Does your app collect or share user data? | Yes | Location + device identifiers via AdMob |
| Location (precise & coarse) | Collected, not shared with 3rd parties by you | `@capacitor/geolocation` for prayer times / qibla |
| Is location collected, shared, optional? | Optional — app works without granting it | Runtime permission request |
| Device or other IDs | Shared with 3rd parties | AdMob (Google) uses advertising ID for ads |
| App interactions | Shared with 3rd parties | AdMob analytics |
| Data encrypted in transit? | Yes | HTTPS everywhere |
| Can users request data deletion? | Yes | All app data is local; uninstalling removes it. Provide an email for requests. |

## Permissions in the manifest

| Permission | Purpose | Play form note |
|---|---|---|
| `INTERNET` | Web content, ads, prayer time API | Normal permission — no declaration needed |
| `ACCESS_FINE_LOCATION` / `COARSE` | Prayer times by position | Declare under "Location" |
| `POST_NOTIFICATIONS` | Dhikr reminders | Declare notification usage |
| `SCHEDULE_EXACT_ALARM` | Exact reminder timing | Declare alarm usage in app content form |

## Store listing (ready-to-paste)

**Short description (80 chars):**
Dhikr counter with tasbih beads, adhkar, prayer times & reminders — Urdu & English.

**Full description:**
Dhikr Counter helps you stay consistent in your daily remembrance of Allah.

🤲 TASBIH COUNTER — Tap to count dhikr with beautiful bead animations, haptic feedback, and configurable round limits (33, 100, custom).

📖 DAILY ADHKAR — Guided morning and evening adhkar with Arabic text, transliteration, and Urdu translation.

🕌 PRAYER TIMES — Accurate prayer times based on your location, plus Qibla direction.

⏰ REMINDERS — Set notifications so you never miss your dhikr sessions.

🌙 LIGHT & DARK — A calm, focused design with the Kaaba backdrop that respects your system theme.

Languages: Urdu, English, Arabic, Turkish, Malay, Indonesian.

Privacy: your dhikr data stays on your device. The app shows ads to remain free.

## Store assets

- ✅ App icon 512×512 PNG (no alpha) — `store-assets/icon-512.png`
- ✅ Feature graphic 1024×500 PNG — `store-assets/feature-graphic-1024x500.png`
- Regenerate both anytime with: `cd dhikr-app && node scripts/make-store-assets.js`
- ⬜ At least 2 phone screenshots (9:16 or 16:9) — capture from the emulator
- ⬜ Privacy policy URL (required — host on GitHub Pages / any static site)
