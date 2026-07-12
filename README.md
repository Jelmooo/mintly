# Mintly — Financial control

A mobile-first personal budgeting **web app** built around an **allocation waterfall**:
it takes your income, subtracts your obligations in a fixed priority order, and
tells you exactly how much to pay yourself — splitting every euro across fixed
expenses, debt, dated savings goals, and personal spending. Whatever's left
sweeps into your top open-ended goal.

Built from the "Allot" design handoff (`_design_handoff/`), rebranded to Mintly
using the logo/icon in `assets/`. The allocation engine (`src/engine.ts`,
`computeBudget`) is ported logic-for-logic from the handoff.

## Run

```
npm install
npm run dev
```

Open http://localhost:5173. State persists to `localStorage`
(`allot.budget.v2`); onboarding flag is `allot.onboarded.v1`.

## Two-account model

- **Main account** — receives all income; pays fixed expenses, debt, and dated
  savings goals.
- **Personal account** — receives whatever's left ("pay yourself"); funds your
  spending budgets; anything still left sweeps into your top open-ended goal.

## Screens (6 tabs)

- **Home** — hero "paid to your personal account", the allocation waterfall bar,
  the two-account flow, savings plan (progress rings), and a spend donut. Plus
  the **Salary in** / **Extra / gift** buttons (see below).
- **Income** — salary cadence (weekly / 4-weekly / monthly) + allowances/extras.
- **Expenses** — fixed costs by category, payday, and a payment calendar.
- **Debt** — paid-down progress + projected clear date.
- **Goals** — priority reorder, optional deadlines, required/funded per month.
- **Personal** — spending budgets + the sweep into your top open goal.

## Money in (the interactive distribution flow)

The handoff is a planner; Mintly keeps Jelmer's interactive flow on top. Press
**💰 Salary in** or **🎁 Extra / gift**: it asks your current account balances,
suggests a split based on the engine (keeping enough on the main account for the
bills), lets you adjust until every euro has a job, updates your goals/debts/
balances, and shows the exact transfers to make.

## Deploy as a website

Mintly is a **static single-page app** — no backend. It uses hash-based routing
and stores all data in the browser's `localStorage` (per browser/device), so any
static file host works with no special configuration.

Build the static site:

```
npm run build      # outputs dist/
```

Then host `dist/` any of these ways:

- **Docker / your own server (nginx):** a `Dockerfile` + `nginx.conf` are
  included.
  ```
  docker build -t mintly .
  docker run -d -p 8080:80 --restart unless-stopped mintly
  ```
  Then put it behind your reverse proxy / TLS (Caddy, Traefik, or an nginx
  vhost) on your domain.
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
