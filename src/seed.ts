import type { AppState } from './types';

/**
 * Blank starting state. New users (and "reset") begin empty and fill everything
 * in via onboarding. No sample/spreadsheet data.
 */
export const seedState: AppState = {
  meta: { mainName: 'Main account', personalName: 'Personal account' },
  customCats: [],
  salary: { amount: '', cadence: 'monthly' },
  income: [],
  expenses: [],
  personalBudgets: [],
  debts: [],
  goals: [],
  mainBalance: 0,
  savingsBalance: 0,
  events: [],
};
