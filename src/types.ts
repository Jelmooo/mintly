export type Cadence = 'weekly' | 'fourweek' | 'monthly';
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

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number | '';
  /** Day of month 1..31. */
  payday: number;
}

export interface PersonalBudget {
  id: string;
  name: string;
  category: string;
  amount: number | '';
}

export interface Debt {
  id: string;
  name: string;
  /** Original balance, for paid-down %. */
  start: number;
  balance: number | '';
  monthly: number | '';
  apr?: number | '';
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
  kind: 'salary' | 'extra';
  label: string;
  amount: number;
  lines: { key: string; name: string; amount: number }[];
}

export interface AppState {
  meta: Meta;
  customCats: CustomCat[];
  salary: Salary;
  income: IncomeExtra[];
  expenses: Expense[];
  personalBudgets: PersonalBudget[];
  debts: Debt[];
  goals: Goal[];
  /** Live balance on the main account. */
  mainBalance: number;
  /** Free savings (not tied to a goal). */
  savingsBalance: number;
  events: MoneyEvent[];
}
