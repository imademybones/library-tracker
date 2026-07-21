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
added v38 — manual cover upload; empty unless the user uploads one by hand).

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
