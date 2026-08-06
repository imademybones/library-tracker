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

Current version: **v41**.

## Changelog

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
