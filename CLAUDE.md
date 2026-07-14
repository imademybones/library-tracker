# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"The Stack" — a personal library/reading tracker PWA. It is a **single static HTML file** (`index.html`, ~5000 lines: one `<style>` block, one `<script>` block) with no build step, no package manager, and no framework. Everything — markup, CSS, and vanilla JS — lives in that one file. The rest of the repo is just the PWA shell: `manifest.json`, `service-worker.js`, icons, and `README.md`.

There is no local database. All data lives in Airtable and is reached through a Cloudflare Worker proxy that is **not part of this repo**.

## Commands

There is no build, lint, or test tooling in this repo — there is nothing to `npm install`.

- **Run it locally**: open `index.html` directly in a browser, or serve the directory (`python3 -m http.server`) if you need the service worker / manifest to behave like they do on GitHub Pages.
- **Deploy**: pushing `index.html`, `manifest.json`, `service-worker.js`, and the icon files to this repo is the deploy — GitHub Pages serves them as-is. There is no separate build artifact.
- **No automated tests exist.** Verify changes by opening the page in a browser and exercising the flow by hand (see the `verify` skill).

## Architecture

### Rendering model
No framework, no virtual DOM. A handful of module-level `let` variables hold all app state (`books`, `readingLog`, `dailyGoal`, `activeTab`, `sortMode`, `compactMode`, etc., declared throughout `<script>` starting ~line 2374). Any state change is followed by a call to `render()` (~line 4221), which rebuilds the relevant DOM via template-string `innerHTML` assignments (see `renderCompactCard`, `renderExpandedCard`, `renderStats`, `renderReadingWidget`). There's no diffing — treat `render()` as "redraw everything that depends on this state."

Four tabs (`stack`, `wishlist`, `history`, `stats`) are plain `div`s toggled by `showTab()` (~line 2416), not routes.

### Data flow: Airtable via Cloudflare Worker
The Airtable API token is never present client-side. All requests go through `airtableRequest()` (~line 3116) to a Cloudflare Worker at `WORKER_URL` (hardcoded ~line 2365), which injects the token server-side and enforces CORS. Three routes map to three Airtable tables:
- bare `WORKER_URL` → `Books` table
- `WORKER_URL/readinglog` → `ReadingLog` table (per-day reading activity, for the streak calc)
- `WORKER_URL/settings` → `Settings` table (single-row app prefs, e.g. daily goal)

`recordToBook()` (~line 3132) maps raw Airtable fields to the in-memory book shape. **Field/table IDs are documented in [tracker-project-reference.md](tracker-project-reference.md) — update that file whenever an Airtable table or field is added, renamed, or the Worker is redeployed elsewhere.** The Worker script itself is pasted directly into the Cloudflare dashboard and is not checked into this repo.

### Other external integrations
- **Google Calendar**: client-side OAuth via Google Identity Services (`accounts.google.com/gsi/client`, loaded in `<head>`). `initGoogleClient()` / `gcalRequest()` (~line 2947 onward) sync a book's due date to an event on the user's primary calendar. Best-effort and non-blocking — failures are caught and toasted, never block the underlying Airtable save.
- **Open Library**: `fetchCover()` (~line 2747) looks up cover art by title/author and caches results in-memory (`coverCache`), keyed `"title|||author"`.

### PWA shell
`service-worker.js` caches only the static app shell (HTML/manifest/icons) via a versioned `CACHE_NAME` (`library-tracker-shell-v16`). It deliberately does not cache Airtable/Calendar/Open Library requests — those must always hit the network. **Bump `CACHE_NAME` on every deploy** or clients will keep serving a stale shell; the `activate` handler clears old caches automatically once the name changes.

### Versioned change log in-place
Feature history is tracked with inline `/* ---- vNN: ... ---- */` comments (currently up to v33) at the top of the `<style>` block and scattered through `<script>`, each describing what that version changed and why. Commit messages in this repo follow the same `vNN: <summary>` convention (see `git log`). When making a non-trivial change, continue this pattern rather than introducing a different changelog mechanism.
