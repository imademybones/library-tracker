# Library Tracker — project reference

Quick lookup for IDs and endpoints used by the app. Update this whenever a
table/field is added, renamed, or the Worker is redeployed elsewhere.

## Airtable

Base: **Library Tracker** — `appWNX589s5RjfJTI`

### Books — `tblpv0NjTFX8vLsMo`
Primary table. Fields (name → id): Title `fldErnCFQ9T6h4ei1`, Author
`fldUncvlnP2kLD0fC`, Borrow Date `fldU2ZL6dKJWOJInO`, Due Date
`fldFbF6m0lLS3imXS`, Renewable `fldpsP33aM7XnX9YQ`, Renew Count
`fldkvR9g7n94UfV7Y`, Currently Reading `fldd6rd8rQDcfCKvd`, Finished
`fldfLGRzadEsLNK9S`, Finished Date `fld1wv3KRmcX2zLun`, Returned
`fldQJp6xWAL1450kG`, Wishlist `fldkhknwCQ6ISRaQj`, Source
`fld3k1AQE7AkV5Xmf`, Calendar Event ID `fld9T3tdwTuDjNt9h`, Notes
`fldzbuQf1kLZFGcDG`, Current Page `fld4D3tuLHA66D8kz`, Total Pages
`fldlkcJFS0Wpn6X3c`, Priority `fldnkWzZLDigdvQN8`, Tags `fldbuGcMaCBmyyejc`,
Wishlist Order `fldJzUsQpk7fSmBJc`, Cover `fldWUCAnKWyA9hYuK` (multipleAttachments,
added v38 — manual cover upload; empty unless the user uploads one by hand),
DNF `fld3ecS1meaBtocct` (checkbox, added v39), DNF Date `fldRRs9xoRlsjdM2H`
(date ISO, added v39), DNF Reason `fldK4qyZKEDLYoD6P` (single line text,
optional, added v39), Genre `fldupfSUCDXZJ0ZIu` (singleSelect, added v40 —
fixed taxonomy of 15 choices: Fiction, Fantasy, Sci-Fi, Mystery/Thriller,
Horror, Romance, Historical Fiction, Non-Fiction, Biography/Memoir,
Self-Help, History, Young Adult, Graphic Novel, Poetry, Classics).
My Rating `fldFmMKmyWnCqRSiw` (rating, 1–5 stars, added v54 — your own
rating; set from the Finish box, History rows, or the Goodreads CSV import;
empty = unrated), OL Avg `fldfparMTrpDJgTAq` (number, 2 decimals — added
v54 as "Goodreads Avg", renamed v55; Open Library community average, cached
by the app), OL Ratings Count `fldqv3IGgnVKmQHws` (number, added v55 — count
behind OL Avg; 0 = looked up and Open Library has no ratings, empty = not
looked up yet).

There is also an undocumented leftover field, `"Field 20"`
(`fldkYhTNjaq9d63Zk`, singleLineText, sits between Wishlist Order and
Cover) — not used anywhere in the app; unclear if it's safe to delete.

### ReadingLog — `tblFfcYAYc2KoTQyv` (added v27)
One record per calendar day with any reading activity, used for the
reading-streak calculation.
- Date — `fldBh6S4ZieYWPeJg` (Date, ISO)
- Pages Read — `fldv0JM24u9LH0uKF` (Number)

### Settings — `tblZEXUOV8iRnILlx` (added v27)
Single-row table for app-wide preferences.
- Daily Goal Pages — `fldKzm8LMILxS8Gip` (Number, default 25 client-side if
  no record exists yet)

## Cloudflare Worker

Deployed at `https://library-tracker-proxy.stephen-nolan85.workers.dev`,
pasted directly into the Cloudflare dashboard (not part of this repo/deploy).
Holds `AIRTABLE_TOKEN` (encrypted secret), `BASE_ID`, and `TABLE_NAME`
(`Books`, the default route) as environment variables.

Routes (path → Airtable table), added v26/v27:
- bare `WORKER_URL` → `Books` (via `env.TABLE_NAME`)
- `WORKER_URL/readinglog` → `ReadingLog`
- `WORKER_URL/settings` → `Settings`

`POST WORKER_URL/books/:recordId/cover` (added v38) — manual cover upload.
Forwards to Airtable's attachment-upload endpoint, a different host
(`content.airtable.com`) than the rest of the app's Airtable calls:
`POST https://content.airtable.com/v0/{baseId}/{recordId}/{fieldId}/uploadAttachment`
with body `{ contentType, file (base64), filename }`. Field ID
(`fldWUCAnKWyA9hYuK`, the `Cover` field) is hardcoded in the route.

CORS is restricted to `Access-Control-Allow-Origin: https://imademybones.github.io`.

## Deploy

`index.html`, `manifest.json`, `service-worker.js`, and the icons are
deployed via GitHub Pages from this repo. The Worker script is deployed
separately by pasting into the Cloudflare dashboard — it is never generated
from or checked into this repo.

Current version: **v57**.

## Changelog

- **v57** — Open Library average on wishlist cards. Bulk lookup (Settings
  → Community ratings) now covers wishlist books as well as finished ones;
  adding a book to the wishlist triggers a background lookup. No schema
  change — reuses `OL Avg` / `OL Ratings Count`.
- **v56** — Open Library lookup fix. v55's bulk lookup sent ~6
  requests/second; Open Library throttles anonymous clients to roughly 1/s,
  so every request failed and nothing was saved. Now paced at ~1.1s per
  request, retries 429/5xx/network errors with 4s/8s/16s backoff, pauses
  after 5 consecutive failures (re-run resumes), and shows live counts and
  the actual error text.
- **v55** — Open Library community ratings; Goodreads import fixes.
  - Goodreads' Export Library CSV no longer has an `Average Rating` column,
    and `My Rating` can now be fractional (quarter stars, e.g. `3.75`).
    The import now rounds to the nearest whole star (v54 truncated — four
    records were corrected by hand in Airtable: Scion, Inanna, The
    Employees, So Thirsty → 4) and no longer looks for an average.
  - `Goodreads Avg` (never populated) renamed `OL Avg`; new `OL Ratings
    Count` field. Settings → Community ratings looks up every finished book
    not yet looked up via Open Library search (`ratings_average`,
    `ratings_count`), accepting only a result whose title matches; saves in
    batches of 10. Finishing a book triggers a silent background lookup.
    History rows show "Open Library 3.7 · 12 ratings".
- **v54** — Ratings + Goodreads import.
  - New Books fields `My Rating` (rating, 1–5) and `Goodreads Avg` (number).
  - Star picker in the Finish box (optional — saved with the finish
    PATCH); tap-to-rate stars on Reading History rows (tap the current
    rating to clear it), with the Goodreads average shown alongside when
    known; "Avg rating" card on the Stats tab.
  - Settings → Goodreads ratings: choose a Goodreads "Export Library" CSV.
    Parsed entirely in the browser; rows are matched to tracker books by
    normalised title (series suffix, subtitle, leading article,
    punctuation and "Volume"/"Vol" ignored) plus author surname. A preview
    shows matches, ratings to add, and Goodreads "read" books not in the
    tracker; Apply PATCHes in batches of 10. Never overwrites an existing
    tracker rating; Goodreads Avg is always refreshed. Safe to re-run.
  - Goodreads stopped issuing API keys in 2020, so there is no live sync.
  - No Worker changes — rides the existing bare `WORKER_URL` → `Books`
    route.
- **v41** — Genre in Stats + editable on finished books.
  - Reading History rows (finished books) now show a genre chip and an
    inline "Genre" select + Save button, patterned on the existing
    Finished-date editor (`saveHistoryGenre()`, same
    isTempId/network-failure/offline-queue handling as
    `saveFinishedDate()`). Before this, genre was only editable on active
    stack/wishlist cards — fixing it on a book you'd already finished
    meant "move back to stack, edit, re-finish."
  - Stats tab gained a "Top genres" ranked list (finished books only,
    same style/ranking as Top authors), between Top authors and Most
    borrowed from.
  - Genre added to the Reading History search filter.
  - No Worker changes — rides the existing bare `WORKER_URL` → `Books`
    route.
- **v40** — Genre + moved the DNF list onto the Wishlist tab.
  - Added a `Genre` singleSelect field (fixed taxonomy, 15 choices — no free
    text, so it stays useful for filtering rather than fragmenting). A
    "– genre –" dropdown was added to: the stack add-modal, the wishlist
    quick-add form, the stack card edit box, and the wishlist row edit box.
    Genre shows as a chip on expanded stack cards, wishlist rows, and DNF
    rows, and is included in every existing search filter.
  - Moved the collapsible "Did not finish" section (`#dnf-wrap`) from the
    History tab to the Wishlist tab — DNF's "Borrow again" is functionally
    a wishlist re-activation, so it now lives next to the rest of the
    to-read list instead of next to Reading History. No change to the DNF
    logic itself, just where the section renders.
  - No Worker changes — both rides the existing bare `WORKER_URL` → `Books`
    route.
- **v39** — Did Not Finish (DNF). Books abandoned mid-read can be marked DNF
  from the active card's overflow menu (clears `Currently Reading`, leaves
  `Finished`/`Returned` untouched, removes the calendar event) and land in a
  new collapsible "Did not finish" section, "Borrow again" reactivates the
  same record in place (clears the DNF fields, sets fresh `Due
  Date`/`Borrow Date`/`Renewable`, resets `Renew Count`/`Current Page` to 0,
  recreates the calendar event) or the entry can be removed for good via
  the existing remove/undo flow. No Worker changes — rides the existing
  bare `WORKER_URL` → `Books` route.
- **v38** — Manual cover upload for Stack hero/cards.
