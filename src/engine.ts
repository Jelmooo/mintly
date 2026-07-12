// engine.ts — categories, formatting, and the allocation engine (ported
// logic-for-logic from the Allot design handoff, computeBudget).
import type { AppState, Cadence, Goal, IncomeExtra, Salary } from './types';

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

export const PCATS: Record<string, CatDef> = {
  groceries: { label: 'Groceries',     color: 'var(--amber)',         icon: 'cart' },
  dining:    { label: 'Going out',     color: 'oklch(0.78 0.13 30)',  icon: 'cup' },
  fun:       { label: 'Fun & hobbies', color: 'var(--violet)',        icon: 'film' },
  shopping:  { label: 'Shopping',      color: 'oklch(0.78 0.13 200)', icon: 'bag' },
  transport: { label: 'Transport',     color: 'oklch(0.78 0.12 130)', icon: 'bus' },
  health:    { label: 'Health',        color: 'oklch(0.78 0.12 350)', icon: 'heart' },
  other:     { label: 'Other',         color: 'var(--text-3)',        icon: 'dot' },
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
  return n(salary.amount) * CADENCE[salary.cadence].perMonth;
}
export function extraMonthly(x: IncomeExtra) {
  const a = n(x.amount);
  return x.freq === 'yearly' ? a / 12 : a;
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
  paidToPersonal: number;
  personalBudgets: AppState['personalBudgets'];
  personalBudgetsTotal: number;
  budByCat: Record<string, number>;
  personalFree: number;
  sweep: number;
  topOpen: FundedGoal | null;
  unbudgeted: number;
  overAllocated: boolean;
  goalsUnderfunded: boolean;
  personalOver: boolean;
}

// ---------- the allocation engine (port exactly) ----------
export function computeBudget(state: AppState): Budget {
  const salM = salaryMonthly(state.salary);
  const extras = state.income.map((x) => ({ ...x, monthly: extraMonthly(x) }));
  const extrasM = extras.reduce((s, x) => s + x.monthly, 0);
  const incomeTotal = salM + extrasM;

  const expensesTotal = state.expenses.reduce((s, e) => s + n(e.amount), 0);
  const expByCat: Record<string, number> = {};
  state.expenses.forEach((e) => { expByCat[e.category] = (expByCat[e.category] || 0) + n(e.amount); });

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

  const paidToPersonal = afterFixed - datedFunded;

  const personalBudgets = state.personalBudgets || [];
  const personalBudgetsTotal = personalBudgets.reduce((s, p) => s + n(p.amount), 0);
  const budByCat: Record<string, number> = {};
  personalBudgets.forEach((p) => { budByCat[p.category] = (budByCat[p.category] || 0) + n(p.amount); });
  const personalFree = paidToPersonal - personalBudgetsTotal;

  const topOpen = goals.find((g) => !g.hasDeadline) || null;
  const sweep = topOpen ? Math.max(0, personalFree) : 0;
  if (topOpen) { topOpen.funded = sweep; topOpen.onTrack = true; }
  const unbudgeted = personalFree - sweep;

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
  };
}
