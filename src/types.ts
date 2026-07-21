export type Cadence = 'weekly' | 'fourweek' | 'monthly' | 'manual';
export type ExtraFreq = 'monthly' | 'yearly';
export type IncomeKind =
  | 'salary' | 'travel' | 'side' | 'vacation' | 'bonus' | 'gifts' | 'refund' | 'other';

export interface Meta {
  mainName: string;
  personalName: string;
}

export interface CustomCat {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export interface Salary {
  amount: number | '';
  cadence: Cadence;
}

export interface IncomeExtra {
  id: string;
  kind: IncomeKind;
  name: string;
  amount: number | '';
  freq: ExtraFreq;
}

export type ExpenseFreq = 'monthly' | 'quarterly' | 'yearly';

export interface Expense {
  id: string;
  name: string;
  category: string;
  /** The charged amount at the given frequency (e.g. €70 per quarter). */
  amount: number | '';
  /** How often it's charged. Missing = monthly. */
  freq?: ExpenseFreq;
  /** Day of month 1..31. */
  payday: number;
}

/** How income amounts are registered in the Add-income flow. */
export type TrackingMode = 'manual' | 'fixed' | 'estimate';

export interface AppSettings {
  tracking: TrackingMode;
}

export interface Debt {
  id: string;
  name: string;
  /** Original total amount owed. */
  total: number | '';
  /** Amount paid off so far. Remaining = total − paid (auto-calculated). */
  paid: number | '';
  monthly: number | '';
  apr?: number | '';
  /** Day of month the payment is due (1..31). */
  payday?: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number | '';
  saved: number | '';
  /** '' = open-ended, or ISO date 'YYYY-MM-DD'. */
  deadline: string;
  /** 1 = highest. */
  priority: number;
}

/** A logged money-in event and how it was distributed. */
export interface MoneyEvent {
  id: string;
  date: string;
  kind: 'salary' | 'extra' | 'income';
  label: string;
  amount: number;
  lines: { key: string; name: string; amount: number }[];
}

export interface AppState {
  meta: Meta;
  settings: AppSettings;
  customCats: CustomCat[];
  salary: Salary;
  income: IncomeExtra[];
  expenses: Expense[];
  debts: Debt[];
  goals: Goal[];
  /** Live balance on the main account. */
  mainBalance: number;
  /** Free savings (not tied to a goal). */
  savingsBalance: number;
  events: MoneyEvent[];
}
