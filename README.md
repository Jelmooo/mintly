# Mintly — Financial control

A mobile-first personal budgeting **web app** built around **leftover
allocation, strictly per pay period**: it looks at the bills and debt payments
actually due in your current period (by paydate), covers those first, and shows
what's genuinely left over — for you to allocate freely (spending, saving
goals) when income arrives. No rigid category budgets.

Built from the "Allot" design handoff (`_design_handoff/`), rebranded to Mintly
using the logo/icon in `assets/`. The engine lives in `src/engine.ts`
(`computeBudget` for the monthly plan; `periodEssentials`/`periodWindowDays`
for the per-period math).

## Run

```
npm install
npm run dev
```

Open http://localhost:5173. State persists to `localStorage`
(`allot.budget.v2`); onboarding flag is `allot.onboarded.v1`.

## Screens (5 tabs + account menu)

- **Home** — hero "left over this period", a period bar, the bills **due this
  period** (with days-until), the monthly plan, savings plan (progress rings)
  and a spend donut. Plus the **Add income** button.
- **Income** — salary cadence (weekly / 4-weekly / monthly / manual) + extras.
- **Expenses** — fixed costs by category, paydate, and **frequency**
  (monthly / quarterly / yearly). Non-monthly bills are spread to a monthly
  equivalent (a €70/quarter bill counts as €23,33/mo) everywhere in the engine.
- **Debt** — enter the **total** and **amount paid**; the remaining balance is
  auto-calculated. Paid-down progress, paydate + projected clear date.
- **Goals** — priority reorder, optional deadlines; dated goals get a planned
  monthly amount, open-ended goals are funded from leftover.
- **Pots** (potjes) — sinking-fund buffers for irregular costs (car repair,
  broken appliance…). Each has a balance, an optional suggested monthly
  set-aside, and an optional target cap. **Deposit** to build it up,
  **withdraw** when something breaks. Pots don't shrink your leftover — the
  Add-income flow just pre-fills each pot's per-period top-up as a suggestion,
  which you can adjust.

The avatar (top right) opens an **account menu**: quick links to edit anything
from onboarding (income, expenses, debts, goals), the **Settings** screen
(payment-tracking mode + edit-your-budget hub), **Restart onboarding** (with a
confirmation, since finishing replaces your data), and **Sign out** (also
confirmed, shown when signed in).

## Smoothed reserves (no lump-sum surprises)

Every obligation **accrues smoothly toward its due date** instead of landing as
a lump. For a bill of €A due in `d` days (recurring monthly), the amount you
should already have set aside now is `A × (monthDays − d) / monthDays`
(`billReserve` in `engine.ts`). So a €500 bill due in 3 weeks builds up ~€155 →
€270 → €385 → €500 across the weeks, then resets once it's paid — you're never
asked to cover the whole thing in one pay period.

This applies to **all sections**: expenses and debts accrue by due date; dated
goals contribute `required / periodsPerMonth` each payday; pots contribute
`monthly / periodsPerMonth`. The Add-income flow pre-fills all of these
smoothed amounts, and the dashboard's "Set aside for bills" card + hero show the
smoothed per-period picture.

- **Path A — scheduled:** the dashboard computes this automatically per payday.
- **Path B — manual:** the dashboard waits for funding with a prominent
  **Add income** button.

**Add income** (both paths) runs the prioritized allocation engine:
1. Your **current main-account balance** (as the bank shows it now, this income
   already included — that balance *is* the amount to split) + how much came in
   this time (recorded for history/estimates; prefilled per the tracking mode).
2. **Cover this period's essentials** — checks balance + income against 100%
   of the bills & debts due in the window and shows what stays on the main
   account. If short, everything stays put.
3. **What's left** — the remainder, shown explicitly, yours to allocate.
4. Optional **savings allocation with integrity check**: before depositing,
   each goal shows its current amount and asks whether it's still accurate
   (did you take money out?) with an inline field to correct the baseline.
5. Transfer summary; goals and the main-account balance update automatically.

## Payment tracking modes (Settings)

- **Manual input** — income amounts are always typed in by hand.
- **Static / fixed** — each period prefills the same recurring amount (your
  salary).
- **Estimated + manual override** — prefills the average of your last incomes;
  always adjustable before confirming.

## Data & sync (Firebase)

Mintly syncs your budget across devices with **Google sign-in + Firestore**.
Until a Firebase config is pasted in, the app automatically runs in
**local-only mode** (localStorage, no login — an amber "no sync" pill shows in
the header).

One-time setup (~5 minutes, all in [console.firebase.google.com](https://console.firebase.google.com)):

1. **Create a project** (e.g. `mintly`). Google Analytics: off is fine.
2. **Authentication → Sign-in method → Google → Enable.**
3. **Authentication → Settings → Authorized domains → Add domain:**
   `mintlybudgetapp.netlify.app` (localhost is already allowed).
4. **Firestore Database → Create database** (production mode, region
   `europe-west4`), then under **Rules** paste:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
5. **Project settings → General → Your apps → Add app → Web** (no hosting),
   then copy the `firebaseConfig` object into `src/firebase-config.ts`.
6. Commit + push — Netlify redeploys and the login screen appears.

How it behaves: each user gets one Firestore document (`users/{uid}`) holding
the whole budget. Writes are debounced; the Firestore offline cache keeps the
app working without a connection. On your first login, any data already on
that device is migrated up automatically. The config values are not secrets —
security comes from the rules above.

## Deploy as a website

Mintly is a **static single-page app** — no server of your own needed. It uses
hash-based routing, so any static file host works with no special
configuration.

Build the static site:

```
npm run build      # outputs dist/
```

Then host `dist/` any of these ways:

- **CasaOS / your own server (Docker + nginx):** `Dockerfile`, `nginx.conf`
  and `docker-compose.yml` are included. On the server:
  ```
  cd "/Live Websites"
  git clone https://github.com/Jelmooo/mintly.git
  cd mintly
  sudo docker compose up -d --build
  ```
  The container is named `mintly` and listens on host port **8096** (8095 is
  taken by tgm-draaiboek). Point your Cloudflare Tunnel at port 8096 for the
  public URL. Updating = `git pull` + `sudo docker compose up -d --build`.
  No data volume is needed: data lives in the visitor's browser
  (localStorage), not on the server.
- **Plain nginx (no Docker):** copy `dist/` to e.g. `/var/www/mintly` and point
  a server block at it (use the included `nginx.conf` as a template).
- **Managed static host:** drag-and-drop `dist/` to Netlify, or connect the repo
  to Vercel/Cloudflare Pages/GitHub Pages (build command `npm run build`, output
  dir `dist`).

Local preview of the production build: `npm run preview`.

Assets are built with a relative base (`vite base: './'`), so the site works at a
domain root **or** a sub-path. Fonts and the logo are bundled (no CDN), so it
also works on an air-gapped/offline server.

## Notes

- Starts **blank** — the first run shows an onboarding wizard (re-runnable via
  the flag icon in the header); "reset" also clears to blank. No sample/
  spreadsheet data ships.
- "Pots" from the old model were dropped in the redesign (per chosen scope).
- The phone-frame shell renders full-screen on a phone and as a 440px device
  mockup on desktop.
