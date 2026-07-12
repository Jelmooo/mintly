# Handoff: Allot — Personal Budget Allocator

## Overview

**Allot** is a mobile-first personal budgeting app built around an *allocation waterfall*: it takes your income, subtracts your obligations in a fixed priority order, and tells you exactly how much to pay yourself — automatically splitting every euro across fixed expenses, debt, savings goals, and personal spending.

The defining concept is a **two-account model**:

- **Main account** — receives all income; pays fixed expenses, debt, and dated savings goals.
- **Personal account** — receives whatever's left ("pay yourself"); funds your discretionary spending budgets; anything still left **sweeps into your top open-ended savings goal**.

The app also has a **first-run onboarding wizard** that walks a new user through entering income, expenses, debts, goals, and personal budgets.

Currency is **Euro**, formatted in Dutch/European convention (`€1.638` — period as thousands separator). Locale strings use `nl-NL` for numbers and `en-GB` for dates.

---

## About the Design Files

The files in `source/` are **design references created in HTML/CSS/JS (React via in-browser Babel)**. They are a working prototype that demonstrates the intended look, layout, interactions, and — importantly — the **exact budgeting math**. They are **not** meant to be shipped as-is.

**Your task:** recreate these designs in the target codebase's environment, using its established framework, component library, state management, and styling conventions. If no environment exists yet, choose an appropriate stack (the prototype is React-shaped, so React/React Native/Next would port most directly, but the logic is framework-agnostic).

The **allocation engine** (`source/app/engine.jsx`, function `computeBudget`) is the one piece you should port **logic-for-logic exactly** — it is the product. Everything else is UI you should rebuild idiomatically.

---

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, radii, motion, and copy are all specified below and in the source. Recreate the UI to match, using the codebase's primitives where equivalents exist. The visual system is custom (dark, premium-fintech), so most of it will be net-new tokens/components rather than reuse.

---

## Tech shape of the prototype (for reference)

- React 18 (UMD) + Babel standalone, no build step. Each screen is its own `*.jsx` file; shared primitives live in `ui.jsx`; pure logic + data in `engine.jsx`.
- All state is a single plain object persisted to `localStorage` under key `allot.budget.v2`. Onboarding completion is a separate key `allot.onboarded.v1`.
- No backend, no data fetching. Everything is local and synchronous.
- "Today" is **pinned** to `2026-06-10` in the prototype (`NOW` in `engine.jsx`) so goal math is deterministic. In production, use the real current date.

---

## Design Tokens

### Color (CSS custom properties, OKLCH)

| Token | Value | Use |
|---|---|---|
| `--bg` | `oklch(0.16 0.008 255)` | App background (near-black, cool) |
| `--bg-2` | `oklch(0.185 0.009 255)` | Inset fields, tracks |
| `--surface` | `oklch(0.205 0.010 255)` | Card background |
| `--surface-2` | `oklch(0.235 0.012 255)` | Ghost buttons, raised chips |
| `--surface-hi` | `oklch(0.27 0.014 255)` | Scrollbar, inactive progress dots |
| `--line` | `oklch(1 0 0 / 0.08)` | Hairline borders |
| `--line-2` | `oklch(1 0 0 / 0.045)` | Faint dividers / list gaps |
| `--text` | `oklch(0.97 0.004 255)` | Primary text |
| `--text-2` | `oklch(0.74 0.012 255)` | Secondary text |
| `--text-3` | `oklch(0.56 0.012 255)` | Tertiary / captions |
| `--accent` | `oklch(0.82 0.15 155)` (mint) | Money-for-you / positive / primary CTA |
| `--blue` | `oklch(0.78 0.13 250)` | Main account, fixed expenses |
| `--amber` | `oklch(0.83 0.14 75)` | Warnings / underfunded |
| `--violet` | `oklch(0.76 0.13 305)` | Debt |
| `--rose` | `oklch(0.74 0.15 18)` | Over-budget / danger |
| savings color | `oklch(0.78 0.13 200)` (teal) | Savings goals (used inline, not a var) |

Accent is **themeable** (Tweaks panel): mint `oklch(0.82 0.15 155)`, blue `oklch(0.80 0.13 250)`, violet `oklch(0.78 0.14 305)`, amber `oklch(0.83 0.14 75)`. All share chroma/lightness, vary hue. Primary-button text on accent is `#06160c`.

Semantic accent tints are built with `color-mix(in oklch, <color> 16%, transparent)` for soft backgrounds and `... 35%, transparent` for borders.

### Typography

- **Display / UI:** `"Space Grotesk"` (Google Fonts), weights 400/500/600/700.
- **Figures / labels / mono:** `"IBM Plex Mono"`, weights 400/500/600.
- Money figures use `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1, "ss01" 1` (class `.num`).
- Headings: `font-weight: 600; letter-spacing: -0.02em`. Big hero numbers go to `letter-spacing: -0.045em`.

Type scale actually used (px):
- Hero number: `clamp(44, 7vw, 72)`, weight 600
- Screen title (h2): 21–26
- Card heading (h3): 16–17
- Stat number: 24
- Body: 14–14.5
- Secondary/meta: 12–13
- Caption/eyebrow: 11 (mono, uppercase, `letter-spacing: 0.14em`)
- Tab label: 9.5

### Spacing, radius, shadow

- Card padding `--pad: 22px` (compact density 16, comfy 28).
- Radii: `--r-sm: 10`, `--r: 16`, `--r-lg: 22`, `--r-xl: 28`; pills/dots use `999`.
- Card shadow: `0 1px 0 oklch(1 0 0 / 0.04) inset, 0 18px 40px -24px oklch(0 0 0 / 0.7)`.
- Standard gap between stacked cards on a screen: `18px`.
- Touch targets: icon buttons 34px; primary CTAs ~44–48px tall.

### Motion

- `fadeUp`: screen enter, `transform: translateY(9px) → none`, `.5s cubic-bezier(.2,.7,.2,1)`. **Opacity is deliberately NOT animated** (so content is always visible for print / reduced-motion / snapshots).
- `growW`: bars scale in on the X axis, `transform: scaleX(0) → scaleX(1)`, `.6–.7s cubic-bezier(.2,.8,.2,1)`, `transform-origin: left`, staggered `i*0.08s`. **Do not use `both`/forwards fill** — base state must be the visible end state.
- `pop`: sheet/modal enter, `opacity 0→1, scale .96→1`, `.26s`.
- Respect `prefers-reduced-motion: reduce` (collapse durations).

---

## The Allocation Engine (port this exactly)

All monetary math is monthly. Source of truth: `computeBudget(state)` in `engine.jsx`.

### Normalizing income to monthly

- **Salary** has `{ amount, cadence }` where cadence ∈ `weekly | fourweek | monthly`. Monthly equivalent = `amount × perMonth`, where `perMonth` is: weekly `52/12`, fourweek `13/12`, monthly `1`.
- **Income extras** each have `{ amount, freq }` where freq ∈ `monthly | yearly`. Monthly equivalent = `freq === "yearly" ? amount/12 : amount`. (Yearly items like vacation money / bonus are spread evenly across 12 months.)
- `incomeTotal = salaryMonthly + Σ extrasMonthly`.

### The waterfall (strict order)

```
incomeTotal
  − expensesTotal            (Σ fixed expenses)
  − debtTotal                (Σ debt monthly payments)
  = afterFixed
  − datedGoalsFunded         (savings goals WITH a deadline, funded by priority)
  = paidToPersonal           ← "pay yourself" amount, the hero number
  − personalBudgetsTotal     (Σ personal spending budgets)
  = personalFree
  → sweep into the single highest-priority goal WITHOUT a deadline
```

### Dated-goal funding (priority waterfall)

Goals are sorted by `priority` ascending (1 = highest). For each goal **with a deadline**:
- `remaining = max(0, target − saved)`
- `months = max(1, ceil(monthsBetween(NOW, deadline)))`
- `required = remaining / months` (per-month needed to hit it on time)

Funding loop over a pool initialized to `max(0, afterFixed)`:
```
for each dated goal in priority order:
    funded = min(required, pool)
    pool  -= funded
    shortfall = required − funded
    onTrack = funded >= required − 0.5
```
`datedFunded = Σ funded`, `datedRequired = Σ required`.

### Personal account + sweep

```
paidToPersonal       = afterFixed − datedFunded
personalBudgetsTotal = Σ personalBudgets.amount
personalFree         = paidToPersonal − personalBudgetsTotal
topOpen              = first goal (priority order) with NO deadline   // may be null
sweep                = topOpen ? max(0, personalFree) : 0
topOpen.funded       = sweep                                          // the open goal "catches the rest"
savingsTotal         = datedFunded + sweep
```

`monthsBetween(from, to)` = whole months + `(dayDiff)/30` fractional. Note `monthsBetween` measures fractional months; `ceil` is applied where a whole-month count is needed.

### Derived flags (drive warnings)

- `overAllocated = expensesTotal + debtTotal > incomeTotal`
- `goalsUnderfunded = datedRequired > max(0, afterFixed) + 0.5`
- `personalOver = personalFree < −0.5` (personal budgets exceed what you pay yourself)

### Category aggregation

- `expByCat` — map of expense `category → Σ amount`.
- `budByCat` — map of personal-budget `category → Σ amount`.
- `cats` — merged category map = built-in `CATEGORIES` plus any `customCats` the user created, keyed by id. Used everywhere a category is rendered.

---

## Data Model (state object)

```jsonc
{
  "meta": { "mainName": "Main account", "personalName": "Personal account" },
  "customCats": [ { "id": "c…", "label": "Childcare", "color": "var(--blue)", "icon": "cart" } ],
  "salary": { "amount": 2800, "cadence": "monthly" },          // cadence: weekly|fourweek|monthly
  "income": [                                                   // extras / allowances
    { "id": "i1", "kind": "travel", "name": "Travel allowance", "amount": 80, "freq": "monthly" }
    // kind: travel|side|vacation|bonus|gifts|refund|other ; freq: monthly|yearly
  ],
  "expenses": [
    { "id": "e1", "name": "Apartment rent", "category": "housing", "amount": 1150, "payday": 1 }
    // payday: day-of-month 1..31
  ],
  "personalBudgets": [
    { "id": "p1", "name": "Groceries", "category": "groceries", "amount": 320 }
  ],
  "debts": [
    { "id": "d1", "name": "Student loan", "start": 12000, "balance": 8200, "monthly": 150, "apr": 2.6 }
    // start = original balance (for paid-down %); apr optional
  ],
  "goals": [
    { "id": "g1", "name": "Emergency buffer", "target": 6000, "saved": 3500, "deadline": "", "priority": 1 }
    // deadline: "" (open-ended) OR ISO date "YYYY-MM-DD" ; priority: 1=highest
  ]
}
```

### Built-in categories

**Expense categories** (`CATEGORIES`): `housing` (Rent / housing), `utilities`, `groceries`, `transport`, `subscriptions`, `insurance`, `phone` (Phone / internet), `other`. Each has `{ label, color, icon }`.

**Personal budget categories** (`PCATS`): `groceries`, `dining` (Going out), `fun` (Fun & hobbies), `shopping`, `transport`, `health`, `other`.

**Income kinds** (`INCOME_KINDS`): `salary`, `travel`, `side`, `vacation`, `bonus`, `gifts`, `refund`, `other`.

**Custom categories:** users can create new expense categories with a chosen color (from an 8-swatch palette `CAT_COLORS`) and icon (from `CAT_ICONS`). Stored in `customCats` and merged into the active category map.

---

## App Shell (mobile-first)

The entire app renders inside a **phone frame** centered on a dark backdrop. On a real phone it fills the viewport; on desktop it's a 440px-wide device mockup (rounded 46px, layered box-shadow bezel, max height `min(948px, 100vh−56px)`).

Vertical structure (flex column, `overflow: hidden`):
1. **Status bar** (`.app-status`) — faux iOS: live `H:MM` clock left; wifi glyph + battery rectangle right. Mono, 13.5px.
2. **Header** (`.app-head`) — rotated-square "A" logo + "Allot / budget allocator"; right side: cadence pill (e.g. "Monthly") + a small icon button to re-run onboarding.
3. **Scroll region** (`.app-scroll`, `flex: 1; overflow-y: auto`) — the active screen. Navigation scrolls this to top (not `window`).
4. **Bottom tab bar** (`.app-tabs`) — 6 tabs: **Home, Income, Expenses, Debt, Goals, Personal**. Column icon + 9.5px label; active = accent color, inactive = `--text-3`.

Navigation uses a `tab` value mirrored to `location.hash`. All layouts are **single-column** (the previous responsive 2-column desktop grids are forced to `1fr`).

---

## Screens / Views

For exact copy, component composition, and inline styles, read the matching source file. Summary of each:

### 1. Home / Overview — `app/overview.jsx`
- **Hero card:** eyebrow "Paid to your personal account"; huge accent number = `paidToPersonal`; one-sentence plain-language explanation of the split (e.g. *"€600 covers your spending budgets and €665 sweeps into Emergency buffer each month."*). Right column: "Monthly income" = `incomeTotal` + cadence pill. A soft radial accent glow sits top-right. If `paidToPersonal < 0` or `personalOver`, hero flips to rose + "You're over budget" copy.
- **Allocation waterfall bar** (the product's signature visual): a single horizontal stacked bar, segments in waterfall order — Fixed expenses (blue), Debt (violet), Dated goals (teal), Personal budget (accent), and "→ {top open goal name}" sweep (teal). Each segment width ∝ its share; labels shown inside if segment >10%. A legend lists every segment with its € value.
- **Warning banner** (amber) when `overAllocated || goalsUnderfunded || personalOver`, with the specific message per case.
- **"Your two accounts" card:** Main account (income in; − expenses, − debt, − dated goals) → "pay yourself {paidToPersonal}/mo" arrow → Personal account (paid in; − spending budgets; − into {top open goal}, or "Free to spend" if no open goal).
- **"Savings plan" card:** each goal as a progress ring + name + funded/mo; dated goals show on-track/needs; open goal shows "catches the rest".
- **"Where your money goes" donut:** conic-gradient ring (CSS `mask` to cut the hole) of expense categories + Debt + Savings + Personal budget, with a 2-col legend; center shows total/month.

### 2. Income — `app/income.jsx`
- **Salary card:** segmented control **Weekly / 4-weekly / Monthly**; money input "Amount per {cadence} pay"; a small per-wk / per-4wk / per-mo equivalence strip; a highlighted "Monthly equivalent" tile = `salaryMonthly`.
- **Allowances & extras list:** each row (coins icon, name, kind · monthly/yearly, `+€amount/mo|/yr`, with `≈ €/mo` for yearly), edit + delete. Add via a bottom sheet (type select, optional label, amount, monthly/yearly segmented).
- Footer: "Total monthly income" = `incomeTotal`.

### 3. Expenses — `app/expenses.jsx`
- **Stat row:** Monthly total / Share of income (% of income) / Items (+ category count).
- **List** sorted by payday | amount | category (segmented). Each row: category dot+icon, name, "`{category} · {ordinal(payday)}`", amount, edit/delete. Single-line with ellipsis (mobile-tuned).
- **Payment calendar:** a horizontal month axis (day 1→31) with a node per payday showing the day's total and a colored dot per expense.
- **Add/Edit sheet:** name; **category picker grid** (built-ins + custom + a dashed "+ New" tile); amount; payday select (1st…31st).
- **Create-category flow:** the "+ New" tile reveals an inline form — name, an 8-swatch color row, an icon grid (`CAT_ICONS`) — "Create category" adds it to `customCats`, selects it, and it becomes reusable everywhere.

### 4. Debt — `app/debt.jsx`
- **Stat row:** Total owed / Paid off so far (% = `(Σstart − Σbalance)/Σstart`, with € of €) / Monthly payments.
- **Per-debt card:** name + APR pill + projected clear date (`ceil(balance/monthly)` months from now); "Remaining" balance; "Paying {monthly}/mo"; a paid-down progress bar (`(start−balance)/start`), with "€X paid (Y%)" and "started at €start".
- **Add/Edit sheet:** name, current balance, monthly payment, (edit also: original balance, APR%).

### 5. Goals — `app/goals.jsx`
- **Stat row:** Saved so far / Total targets (% of all goals) / Funding per month (= `savingsTotal`; "on track" or "dated goals need €X").
- **Per-goal card:** up/down **priority reorder** controls + priority number; progress ring (%); name + status pill; saved/target; progress bar; then a 3-metric strip:
  - **Dated goal:** Deadline (mon/yr, "{n} mo left") · Need/mo (`required`, "€remaining to go") · Funding now (`funded`/mo; "covered" or "−€shortfall short").
  - **Open-ended goal:** pill "no deadline" (or "→ catches the rest" if it's the top open goal) · Deadline "None / ongoing" · To go · Funding now (sweep "from leftover" for the top open goal, else "raise priority to fund").
- **Add/Edit sheet:** name; target; saved; **deadline segmented "No deadline / By a date"**; date picker only when dated. Copy explains the top no-deadline goal catches the leftover.

### 6. Personal — `app/personal.jsx`
- **Stat row:** Paid to you/month (`paidToPersonal`) / Budgeted to spend (`personalBudgetsTotal`) / "Swept into {top open goal}" (`sweep`) — or "Unbudgeted".
- **Over-budget banner** (rose) when `personalOver`.
- **Spending budgets list:** each row (category dot, name, "{category} · {%} of your pay", amount, edit/delete). Add sheet: name, PCATS category select, monthly amount. Footer "Total budgeted".
- **"The rest goes to" card:** the top open goal (target icon, "no deadline · ongoing", `sweep`/mo, explanation, "Manage goals" link). If no open goal: prompt to add one to auto-save the leftover.
- **"How your pay splits" mini-bar:** Budgets / Saved / Free.

### 7. Onboarding wizard — `app/onboarding.jsx`
First-run overlay (covers the phone). Shown when `localStorage["allot.onboarded.v1"]` is absent/empty. Starts from an **empty** draft (`EMPTY`), commits to state on finish and sets the flag.

- **Welcome:** logo, "Let's build your budget plan", value-prop copy, a 4-item feature list (Income / Expenses / Goals / Personal money), **Get started** (primary) + **"explore with sample data"** (loads the pre-filled `SAMPLE` and skips).
- **5 input steps** with a top progress: back button · 5-dot progress (active dot widens to 22px, completed dots accent) · "Skip all":
  1. **Income** — cadence segmented + take-home amount (shows ≈/month) + optional extras quick-add.
  2. **Fixed expenses** — quick-add (name, category select, amount, payday) with a running list.
  3. **Debts** — quick-add (name, balance, monthly).
  4. **Goals** — quick-add (name, target, saved, deadline segmented + date).
  5. **Personal money** — quick-add (name, PCATS category, amount); copy explains the sweep.
  - Each step: footer "Step N of 5 · Continue". Each quick-add is a dashed card with fields + an "Add" button; added items render as removable rows.
- **Done:** check badge, "You're all set", a summary card (`paidToPersonal` + Monthly income / Fixed expenses / Debt / Into savings / Personal budgets), **Enter Allot**.

Re-runnable anytime via the header icon button or the Tweaks "Re-run onboarding" button.

---

## Shared Components — `app/ui.jsx`

Rebuild these as your design-system primitives:
- **Icon** — single-path stroke glyphs (`stroke-width 1.7`, round caps), keyed by name. Full path set is in `ui.jsx` (`ICON_PATHS`). Replace with your icon library; names used: home, bolt, cart, bus, play, shield, wifi, dot, wallet, arrow, plus, trash, check, target, flag, card, pie, cal, trend, coins, cup, bag, film, heart, user.
- **Card** — surface + hairline border + radius `--r-lg` + card shadow.
- **Segmented** — pill segmented control; active = `--text` fill on `--bg` text.
- **MoneyInput** — number input with `€` prefix, mono, tabular.
- **TextInput / Select** — inset `--bg-2` fields.
- **Btn** — variants: `primary` (accent), `solid`, `ghost`, `dim`, `danger`; sizes sm/md; optional leading icon; fully rounded.
- **IconBtn** — 34px square ghost icon button (hover lifts bg/text).
- **Bar** — horizontal progress bar (`growW` animation).
- **Ring** — conic-gradient progress ring with masked hole; children centered.
- **CatDot** — rounded category chip (tinted bg + colored icon); accepts a category map (built-ins or PCATS or merged).
- **Sheet** — bottom sheet **scoped to the phone** (`position: absolute; inset: 0` within the relatively-positioned phone), dim+blur backdrop, `pop` enter, Esc-to-close, optional footer.
- **Field / Pill** — labeled form group; mono tag/pill.

---

## State Management

- Single source-of-truth state object (see Data Model), persisted to `localStorage["allot.budget.v2"]` on every change; loaded on init (falls back to `SAMPLE`).
- `update(fn)` applies functional updates immutably. `reset()` restores `SAMPLE`.
- Onboarding completion flag: `localStorage["allot.onboarded.v1"]` (truthy string = onboarded).
- `computeBudget(state)` is recomputed (memoized on `state`) and passed to every screen as `b`. **Screens never compute money themselves** — they read fields off `b`.
- In production, replace localStorage with your persistence layer and `NOW` with the real date; the rest of the logic is unchanged.

---

## Tweaks / Theming (optional to port)

The prototype includes a "Tweaks" panel (toggleable) exposing: **Accent** color (mint/blue/violet/amber), **Density** (compact/regular/comfy → adjusts `--pad`/radii), **Show cadence in header** toggle, **Re-run onboarding**, **Reset to sample**. These are prototype affordances — port only if you want runtime theming. Accent + density map cleanly to CSS variables.

---

## Assets

- **Fonts:** Google Fonts — *Space Grotesk* (400/500/600/700) and *IBM Plex Mono* (400/500/600). Self-host in production.
- **Icons:** custom single-path SVGs (see `ui.jsx`). Swap for your icon set by name.
- **No raster images / logos.** The "logo" is a CSS rotated square with the letter "A". No brand assets are used; substitute your own product branding.
- **Color/illustration:** none — everything is solid color + conic/linear gradients drawn in CSS.

---

## Files (in `source/`)

| File | Contents |
|---|---|
| `index.html` | Shell: fonts, all CSS tokens + phone-shell layout + keyframes, script load order |
| `app/engine.jsx` | **Categories, income kinds, cadence, formatting, `computeBudget` (the allocation engine), `SAMPLE` + `EMPTY` data** |
| `app/ui.jsx` | Shared primitives + icon path set |
| `app/overview.jsx` | Home / Overview (hero, waterfall, two-account flow, savings plan, donut) |
| `app/income.jsx` | Income (salary cadence, extras) |
| `app/expenses.jsx` | Expenses (list, payday calendar, category creation) |
| `app/debt.jsx` | Debt (paid-down progress, payments) |
| `app/goals.jsx` | Goals (priority reorder, optional deadlines) |
| `app/personal.jsx` | Personal account (budgets + sweep) |
| `app/onboarding.jsx` | First-run wizard |
| `app/app.jsx` | Phone shell, nav, state/persistence, onboarding integration, Tweaks |
| `tweaks-panel.jsx` | Tweaks panel host (prototype-only) |

**Start here:** read `engine.jsx` first (the model + math), then `app.jsx` (shell + state), then each screen.
