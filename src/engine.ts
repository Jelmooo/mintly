// engine.ts — categories, formatting, and the allocation engine (ported
// logic-for-logic from the Allot design handoff, computeBudget).
import type { AppState, Cadence, Debt, Expense, ExpenseFreq, Goal, IncomeExtra, Salary } from './types';

export interface CatDef { label: string; color: string; icon: string; hue?: number }

export const CATEGORIES: Record<string, CatDef> = {
  housing:       { label: 'Rent / housing',   color: 'var(--blue)',          hue: 250, icon: 'home' },
  utilities:     { label: 'Utilities',        color: 'var(--accent)',        hue: 155, icon: 'bolt' },
  groceries:     { label: 'Groceries',        color: 'var(--amber)',         hue: 75,  icon: 'cart' },
  transport:     { label: 'Transport',        color: 'var(--violet)',        hue: 305, icon: 'bus' },
  subscriptions: { label: 'Subscriptions',    color: 'oklch(0.78 0.13 200)', hue: 200, icon: 'play' },
  insurance:     { label: 'Insurance',        color: 'oklch(0.78 0.12 30)',  hue: 30,  icon: 'shield' },
  phone:         { label: 'Phone / internet', color: 'oklch(0.78 0.12 130)', hue: 130, icon: 'wifi' },
  other:         { label: 'Other',            color: 'var(--text-3)',        hue: 0,   icon: 'dot' },
};

export const INCOME_KINDS: Record<string, { label: string }> = {
  salary:   { label: 'Salary' },
  travel:   { label: 'Travel allowance' },
  side:     { label: 'Side income' },
  vacation: { label: 'Vacation money' },
  bonus:    { label: 'Bonus' },
  gifts:    { label: 'Gifts' },
  refund:   { label: 'Tax refund' },
  other:    { label: 'Other income' },
};

export const CADENCE: Record<Cadence, { label: string; short: string; perMonth: number }> = {
  weekly:   { label: 'Weekly',   short: 'wk',  perMonth: 52 / 12 },
  fourweek: { label: '4-weekly', short: '4wk', perMonth: 13 / 12 },
  monthly:  { label: 'Monthly',  short: 'mo',  perMonth: 1 },
  // Variable income: no fixed salary, money is added manually as it arrives.
  manual:   { label: 'Manual',   short: 'var', perMonth: 0 },
};

export const CAT_COLORS = [
  'var(--blue)', 'var(--accent)', 'var(--amber)', 'var(--violet)',
  'oklch(0.78 0.13 200)', 'oklch(0.78 0.13 30)', 'oklch(0.78 0.12 130)', 'oklch(0.78 0.12 350)',
];
export const CAT_ICONS = ['cart', 'home', 'bolt', 'bus', 'play', 'shield', 'wifi', 'card', 'coins', 'cup', 'bag', 'film', 'heart', 'dot'];

/** Real "today". (Prototype pinned this to 2026-06-10; we use the live date.) */
export const NOW = new Date();

const n = (v: unknown) => Number(v) || 0;

// ---------- formatting ----------
export function fmtEur(value: number, opts: { cents?: boolean; sign?: boolean } = {}): string {
  const { cents = false, sign = false } = opts;
  const v = Math.round(cents ? value * 100 : value) / (cents ? 100 : 1);
  const s = Math.abs(v).toLocaleString('nl-NL', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  const pre = v < 0 ? '−' : sign ? '+' : '';
  return pre + '€' + s;
}
export function fmtNum(value: number) { return Math.round(value).toLocaleString('nl-NL'); }
export function monthsBetween(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) +
    (to.getDate() - from.getDate()) / 30;
}
export function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function fmtMonth(d: Date) {
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}
export function ordinal(num: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
}
export function uid(p: string) { return p + Math.random().toString(36).slice(2, 8); }

// ---------- per-item monthly equivalents ----------
export function salaryMonthly(salary: Salary) {
  if (salary.cadence === 'manual') return 0; // variable — added as it arrives
  return n(salary.amount) * CADENCE[salary.cadence].perMonth;
}
export function extraMonthly(x: IncomeExtra) {
  const a = n(x.amount);
  return x.freq === 'yearly' ? a / 12 : a;
}

export const EXPENSE_FREQ: Record<ExpenseFreq, { label: string; short: string; per: number }> = {
  monthly:   { label: 'Monthly',   short: 'mo', per: 1 },
  quarterly: { label: 'Quarterly', short: 'q',  per: 3 },
  yearly:    { label: 'Yearly',    short: 'yr', per: 12 },
};

/** Monthly-equivalent of an expense (a €70/quarter bill counts as €23.33/mo). */
export function expenseMonthly(e: Expense): number {
  return n(e.amount) / EXPENSE_FREQ[e.freq ?? 'monthly'].per;
}

/** Remaining balance of a debt = total − paid. */
export function debtRemaining(d: Debt): number {
  return Math.max(0, n(d.total) - n(d.paid));
}

export interface FundedGoal extends Goal {
  remaining: number;
  hasDeadline: boolean;
  months: number | null;
  required: number;
  funded: number;
  shortfall: number;
  onTrack: boolean;
}

export interface Budget {
  salM: number;
  extrasM: number;
  incomeTotal: number;
  extras: (IncomeExtra & { monthly: number })[];
  expensesTotal: number;
  expByCat: Record<string, number>;
  debtTotal: number;
  cats: Record<string, CatDef>;
  afterFixed: number;
  goals: FundedGoal[];
  dated: FundedGoal[];
  datedFunded: number;
  datedRequired: number;
  savingsTotal: number;
  /** What remains each month after expenses, debts and dated goals — yours to allocate. */
  leftover: number;
  overAllocated: boolean;
  goalsUnderfunded: boolean;
}

// ---------- the allocation engine ----------
// income − expenses − debts − dated goals (by priority) = leftover.
// No rigid category budgets: leftover is allocated by the user when money
// arrives (Add income), including deposits into open-ended goals.
export function computeBudget(state: AppState): Budget {
  const salM = salaryMonthly(state.salary);
  const extras = state.income.map((x) => ({ ...x, monthly: extraMonthly(x) }));
  const extrasM = extras.reduce((s, x) => s + x.monthly, 0);
  const incomeTotal = salM + extrasM;

  const expensesTotal = state.expenses.reduce((s, e) => s + expenseMonthly(e), 0);
  const expByCat: Record<string, number> = {};
  state.expenses.forEach((e) => { expByCat[e.category] = (expByCat[e.category] || 0) + expenseMonthly(e); });

  const debtTotal = state.debts.reduce((s, d) => s + n(d.monthly), 0);

  const cats: Record<string, CatDef> = { ...CATEGORIES };
  (state.customCats || []).forEach((c) => { cats[c.id] = { label: c.label, color: c.color, icon: c.icon }; });

  const afterFixed = incomeTotal - expensesTotal - debtTotal;

  const goals: FundedGoal[] = [...state.goals].sort((a, b) => a.priority - b.priority).map((g) => {
    const remaining = Math.max(0, n(g.target) - n(g.saved));
    const hasDeadline = !!g.deadline;
    const months = hasDeadline ? Math.max(1, Math.ceil(monthsBetween(NOW, new Date(g.deadline)))) : null;
    const required = hasDeadline ? remaining / (months as number) : 0;
    return { ...g, remaining, hasDeadline, months, required, funded: 0, shortfall: 0, onTrack: true };
  });

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

  const leftover = afterFixed - datedFunded;
  const savingsTotal = datedFunded;

  const overAllocated = expensesTotal + debtTotal > incomeTotal;
  const goalsUnderfunded = datedRequired > Math.max(0, afterFixed) + 0.5;

  return {
    salM, extrasM, incomeTotal, extras,
    expensesTotal, expByCat,
    debtTotal, cats,
    afterFixed,
    goals, dated, datedFunded, datedRequired, savingsTotal,
    leftover,
    overAllocated, goalsUnderfunded,
  };
}

// ---------- period-based calculations ----------
// Everything below reasons about the CURRENT pay period only (spec: "€600 in,
// €400 of bills due this period → €200 left"), never about grand totals.

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Length of one pay period in days, starting at `from`. */
export function periodWindowDays(c: Cadence, from: Date = new Date()): number {
  if (c === 'weekly') return 7;
  if (c === 'fourweek') return 28;
  // monthly & manual: until the same day next month
  const next = new Date(from.getFullYear(), from.getMonth() + 1, from.getDate());
  return Math.max(28, Math.round((next.getTime() - from.getTime()) / 86400000));
}

/** Days until a monthly bill (day-of-month, clamped to month length) is next due. */
export function nextDueInDays(payday: number, from: Date = new Date(), horizon = 62): number {
  for (let i = 0; i < horizon; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    if (d.getDate() === Math.min(payday, daysInMonth(d))) return i;
  }
  return horizon;
}

export interface PeriodBill {
  name: string;
  payday: number;
  v: number;
  kind: 'expense' | 'debt';
  inDays: number;
  /** Set on non-monthly expenses so the UI can flag them (e.g. "quarterly"). */
  freq?: ExpenseFreq;
}
export interface PeriodEssentials {
  days: number;
  rows: PeriodBill[];
  expenses: number;
  debts: number;
  total: number;
}

/** The bills and debt payments that actually fall due within the current period. */
export function periodEssentials(state: AppState, from: Date = new Date()): PeriodEssentials {
  const days = periodWindowDays(state.salary.cadence, from);
  const rows: PeriodBill[] = [];
  for (const e of state.expenses) {
    const v = expenseMonthly(e); // quarterly/yearly spread to a monthly reserve
    if (v <= 0) continue;
    const inDays = nextDueInDays(e.payday ?? 1, from);
    if (inDays < days) rows.push({ name: e.name, payday: e.payday ?? 1, v, kind: 'expense', inDays, freq: e.freq ?? 'monthly' });
  }
  for (const d of state.debts) {
    const v = n(d.monthly);
    if (v <= 0 || debtRemaining(d) <= 0) continue;
    const inDays = nextDueInDays(d.payday ?? 1, from);
    if (inDays < days) rows.push({ name: d.name, payday: d.payday ?? 1, v, kind: 'debt', inDays });
  }
  rows.sort((a, b) => a.inDays - b.inDays);
  const expenses = rows.filter((r) => r.kind === 'expense').reduce((s, r) => s + r.v, 0);
  const debts = rows.filter((r) => r.kind === 'debt').reduce((s, r) => s + r.v, 0);
  return { days, rows, expenses, debts, total: expenses + debts };
}

/** Income expected in one period (salary per pay + monthly extras averaged). */
export function periodIncome(state: AppState): number {
  const per = CADENCE[state.salary.cadence].perMonth;
  if (per <= 0) return 0; // manual — unknown until it arrives
  const extrasM = state.income.reduce((s, x) => s + extraMonthly(x), 0);
  return n(state.salary.amount) + extrasM / per;
}
