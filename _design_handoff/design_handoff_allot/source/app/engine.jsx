// engine.jsx — sample data, the budget/allocation engine, euro formatting.
// All exports pushed to window for cross-script access.

const CATEGORIES = {
  housing:       { label: "Rent / housing",   color: "var(--blue)",   hue: 250, icon: "home" },
  utilities:     { label: "Utilities",        color: "var(--accent)", hue: 155, icon: "bolt" },
  groceries:     { label: "Groceries",        color: "var(--amber)",  hue: 75,  icon: "cart" },
  transport:     { label: "Transport",        color: "var(--violet)", hue: 305, icon: "bus" },
  subscriptions: { label: "Subscriptions",    color: "oklch(0.78 0.13 200)", hue: 200, icon: "play" },
  insurance:     { label: "Insurance",        color: "oklch(0.78 0.12 30)",  hue: 30,  icon: "shield" },
  phone:         { label: "Phone / internet", color: "oklch(0.78 0.12 130)", hue: 130, icon: "wifi" },
  other:         { label: "Other",            color: "var(--text-3)", hue: 0,   icon: "dot" },
};

// personal-account discretionary budget categories
const PCATS = {
  groceries: { label: "Groceries",     color: "var(--amber)",            icon: "cart"  },
  dining:    { label: "Going out",     color: "oklch(0.78 0.13 30)",     icon: "cup"   },
  fun:       { label: "Fun & hobbies", color: "var(--violet)",           icon: "film"  },
  shopping:  { label: "Shopping",      color: "oklch(0.78 0.13 200)",    icon: "bag"   },
  transport: { label: "Transport",     color: "oklch(0.78 0.12 130)",    icon: "bus"   },
  health:    { label: "Health",        color: "oklch(0.78 0.12 350)",    icon: "heart" },
  other:     { label: "Other",         color: "var(--text-3)",           icon: "dot"   },
};

const INCOME_KINDS = {
  salary:    { label: "Salary" },
  travel:    { label: "Travel allowance" },
  side:      { label: "Side income" },
  vacation:  { label: "Vacation money" },
  bonus:     { label: "Bonus" },
  gifts:     { label: "Gifts" },
  refund:    { label: "Tax refund" },
  other:     { label: "Other income" },
};

const CADENCE = {
  weekly:   { label: "Weekly",    short: "wk",  perMonth: 52 / 12 },
  fourweek: { label: "4-weekly",  short: "4wk", perMonth: 13 / 12 },
  monthly:  { label: "Monthly",   short: "mo",  perMonth: 1 },
};

const NOW = new Date(2026, 5, 10); // June 10, 2026 — fixed "today" for the prototype

// palettes offered when creating a custom expense category
const CAT_COLORS = [
  "var(--blue)", "var(--accent)", "var(--amber)", "var(--violet)",
  "oklch(0.78 0.13 200)", "oklch(0.78 0.13 30)", "oklch(0.78 0.12 130)", "oklch(0.78 0.12 350)",
];
const CAT_ICONS = ["cart", "home", "bolt", "bus", "play", "shield", "wifi", "card", "coins", "cup", "bag", "film", "heart", "dot"];

// ---------- formatting ----------
function fmtEur(n, opts = {}) {
  const { cents = false, sign = false } = opts;
  const v = Math.round(cents ? n * 100 : n) / (cents ? 100 : 1);
  const s = Math.abs(v).toLocaleString("nl-NL", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  const pre = v < 0 ? "−" : sign ? "+" : "";
  return pre + "€" + s;
}
function fmtNum(n) {
  return Math.round(n).toLocaleString("nl-NL");
}
function monthsBetween(from, to) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) +
    (to.getDate() - from.getDate()) / 30;
}
function fmtDate(d) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---------- per-item monthly equivalents ----------
function salaryMonthly(salary) {
  return (Number(salary.amount) || 0) * CADENCE[salary.cadence].perMonth;
}
function extraMonthly(x) {
  const a = Number(x.amount) || 0;
  return x.freq === "yearly" ? a / 12 : a; // monthly | yearly
}

// ---------- the allocation engine ----------
// Waterfall:
//   income
//     - fixed expenses (main account)
//     - debt (main account)
//     - dated savings goals, funded by priority (main account)
//   = paid to PERSONAL account
//     - personal budgets (groceries, going out, ...)
//   = leftover sweeps into the top goal WITHOUT a deadline
function computeBudget(state) {
  const salM = salaryMonthly(state.salary);
  const extras = state.income.map((x) => ({ ...x, monthly: extraMonthly(x) }));
  const extrasM = extras.reduce((s, x) => s + x.monthly, 0);
  const incomeTotal = salM + extrasM;

  const expensesTotal = state.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const expByCat = {};
  state.expenses.forEach((e) => { expByCat[e.category] = (expByCat[e.category] || 0) + (Number(e.amount) || 0); });

  const debtTotal = state.debts.reduce((s, d) => s + (Number(d.monthly) || 0), 0);

  // merged category map: built-ins + any custom categories the user created
  const cats = { ...CATEGORIES };
  (state.customCats || []).forEach((c) => { cats[c.id] = { label: c.label, color: c.color, icon: c.icon }; });

  const afterFixed = incomeTotal - expensesTotal - debtTotal;

  // goals by priority; deadlined vs open-ended
  const goals = [...state.goals].sort((a, b) => a.priority - b.priority).map((g) => {
    const remaining = Math.max(0, (Number(g.target) || 0) - (Number(g.saved) || 0));
    const hasDeadline = !!g.deadline;
    const months = hasDeadline ? Math.max(1, Math.ceil(monthsBetween(NOW, new Date(g.deadline)))) : null;
    const required = hasDeadline ? remaining / months : 0;
    return { ...g, remaining, hasDeadline, months, required, funded: 0, shortfall: 0, onTrack: true };
  });

  // 1) fund dated goals by priority from what's left after fixed costs
  let pool = Math.max(0, afterFixed);
  goals.forEach((g) => {
    if (g.hasDeadline) {
      g.funded = Math.min(g.required, pool);
      pool -= g.funded;
      g.shortfall = g.required - g.funded;
      g.onTrack = g.funded >= g.required - 0.5;
    }
  });
  const dated = goals.filter((g) => g.hasDeadline);
  const datedFunded = dated.reduce((s, g) => s + g.funded, 0);
  const datedRequired = dated.reduce((s, g) => s + g.required, 0);

  // 2) the rest is paid into the personal account
  const paidToPersonal = afterFixed - datedFunded;

  // 3) personal budgets come out of the personal account
  const personalBudgets = state.personalBudgets || [];
  const personalBudgetsTotal = personalBudgets.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const budByCat = {};
  personalBudgets.forEach((p) => { budByCat[p.category] = (budByCat[p.category] || 0) + (Number(p.amount) || 0); });
  const personalFree = paidToPersonal - personalBudgetsTotal; // leftover to sweep

  // 4) everything left sweeps into the top open-ended goal
  const topOpen = goals.find((g) => !g.hasDeadline) || null;
  const sweep = topOpen ? Math.max(0, personalFree) : 0;
  if (topOpen) { topOpen.funded = sweep; topOpen.onTrack = true; }
  const unbudgeted = personalFree - sweep; // 0 once swept; <0 means budgets exceed your pay

  const savingsTotal = datedFunded + sweep;

  const overAllocated = expensesTotal + debtTotal > incomeTotal;
  const goalsUnderfunded = datedRequired > Math.max(0, afterFixed) + 0.5;
  const personalOver = personalFree < -0.5;

  return {
    salM, extrasM, incomeTotal, extras,
    expensesTotal, expByCat,
    debtTotal, cats,
    afterFixed,
    goals, dated, datedFunded, datedRequired, savingsTotal,
    paidToPersonal,
    personalBudgets, personalBudgetsTotal, budByCat, personalFree, sweep, topOpen, unbudgeted,
    overAllocated, goalsUnderfunded, personalOver,
    toPersonal: paidToPersonal,
    remainder: unbudgeted,
  };
}

// ---------- sample state ----------
const EMPTY = {
  meta: { mainName: "Main account", personalName: "Personal account" },
  customCats: [],
  salary: { amount: "", cadence: "monthly" },
  income: [], expenses: [], personalBudgets: [], debts: [], goals: [],
};

const SAMPLE = {
  meta: { mainName: "Main account", personalName: "Personal account" },
  customCats: [],
  salary: { amount: 2800, cadence: "monthly" },
  income: [
    { id: "i1", kind: "travel",   name: "Travel allowance", amount: 80,   freq: "monthly" },
    { id: "i2", kind: "side",     name: "Freelance design", amount: 250,  freq: "monthly" },
    { id: "i3", kind: "vacation", name: "Vacation money",   amount: 2400, freq: "yearly"  },
    { id: "i4", kind: "bonus",    name: "Year-end bonus",   amount: 1500, freq: "yearly"  },
  ],
  expenses: [
    { id: "e1", name: "Apartment rent",    category: "housing",       amount: 1150, payday: 1  },
    { id: "e2", name: "Energy & water",    category: "utilities",     amount: 160,  payday: 1  },
    { id: "e4", name: "Transit pass",      category: "transport",     amount: 90,   payday: 27 },
    { id: "e5", name: "Phone & internet",  category: "phone",         amount: 55,   payday: 15 },
    { id: "e6", name: "Streaming + apps",  category: "subscriptions", amount: 38,   payday: 20 },
    { id: "e7", name: "Health insurance",  category: "insurance",     amount: 145,  payday: 1  },
  ],
  personalBudgets: [
    { id: "p1", name: "Groceries",     category: "groceries", amount: 320 },
    { id: "p2", name: "Going out",     category: "dining",    amount: 150 },
    { id: "p3", name: "Fun & hobbies", category: "fun",       amount: 70  },
    { id: "p4", name: "Clothing",      category: "shopping",  amount: 60  },
  ],
  debts: [
    { id: "d1", name: "Student loan",  start: 12000, balance: 8200, monthly: 150, apr: 2.6 },
    { id: "d2", name: "Credit card",   start: 2500,  balance: 1400, monthly: 120, apr: 18.9 },
  ],
  goals: [
    { id: "g1", name: "Emergency buffer", target: 6000, saved: 3500, deadline: "",           priority: 1 },
    { id: "g2", name: "New laptop",       target: 1800, saved: 900,  deadline: "2026-12-31", priority: 2 },
    { id: "g3", name: "Trip to Japan",    target: 3500, saved: 1200, deadline: "2027-08-31", priority: 3 },
  ],
};

Object.assign(window, {
  CATEGORIES, PCATS, INCOME_KINDS, CADENCE, NOW, CAT_COLORS, CAT_ICONS,
  fmtEur, fmtNum, fmtDate, ordinal, monthsBetween,
  salaryMonthly, extraMonthly, computeBudget, SAMPLE, EMPTY,
});
