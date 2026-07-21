import { useState, type CSSProperties, type ReactNode } from 'react';
import type { AppState, Debt, Expense, ExpenseFreq, Goal, IncomeExtra } from '../types';
import { CADENCE, CATEGORIES, computeBudget, EXPENSE_FREQ, fmtEur, fmtMonth, INCOME_KINDS, NOW, ordinal, salaryMonthly, uid } from '../engine';
import { Btn, CatDot, DateInput, Icon, MoneyInput, Segmented, Select, TextInput } from '../ui';
import logoUrl from '../assets/Logo.svg';

const EMPTY: AppState = {
  meta: { mainName: 'Main account', personalName: 'Personal account' },
  settings: { tracking: 'fixed' },
  customCats: [], salary: { amount: '', cadence: 'monthly' },
  income: [], expenses: [], debts: [], goals: [], pots: [],
  mainBalance: 0, savingsBalance: 0, events: [],
};

const STEPS = [
  { key: 'welcome' },
  { key: 'income', title: 'Your income', icon: 'coins', sub: 'How are you paid?' },
  { key: 'expenses', title: 'Fixed expenses', icon: 'cart', sub: 'Recurring bills from your main account' },
  { key: 'debts', title: 'Debts', icon: 'card', sub: 'Track what you owe — optional' },
  { key: 'goals', title: 'Savings goals', icon: 'target', sub: 'What are you saving for?' },
  { key: 'done', title: "You're all set", icon: 'check' },
] as const;
const INPUT_STEPS = 4;

function nextYear() { const d = new Date(NOW); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); }

export function Onboarding({ onFinish, onSkip }: {
  onFinish: (draft: AppState) => void; onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AppState>(() => JSON.parse(JSON.stringify(EMPTY)));
  const meta = STEPS[step];

  const [exp, setExp] = useState({ name: '', category: 'housing', amount: '' as number | '', freq: 'monthly' as ExpenseFreq, payday: 1 });
  const [debt, setDebt] = useState({ name: '', total: '' as number | '', paid: 0 as number | '', monthly: '' as number | '', payday: 1 });
  const [goal, setGoal] = useState({ name: '', target: '' as number | '', saved: 0 as number | '', deadline: '' });
  const [extra, setExtra] = useState({ kind: 'travel', name: '', amount: '' as number | '', freq: 'monthly' as 'monthly' | 'yearly' });

  const setSalary = (k: 'amount' | 'cadence', v: unknown) => setDraft((d) => ({ ...d, salary: { ...d.salary, [k]: v } as AppState['salary'] }));
  const pushTo = <K extends 'income' | 'expenses' | 'debts' | 'goals'>(key: K, item: AppState[K][number]) =>
    setDraft((d) => ({ ...d, [key]: [...d[key], item] } as AppState));
  const removeFrom = (key: 'income' | 'expenses' | 'debts' | 'goals', id: string) =>
    setDraft((d) => ({ ...d, [key]: (d[key] as { id: string }[]).filter((x) => x.id !== id) } as AppState));

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="onboarding app-bg">
      {meta.key === 'welcome' ? (
        <Welcome onStart={() => setStep(1)} onSkip={onSkip} />
      ) : (
        <>
          <div style={{ flex: '0 0 auto', padding: '20px 20px 12px' }} className="onb-col">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <button onClick={back} style={ghost}><Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
              {meta.key !== 'done' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: INPUT_STEPS }).map((_, i) => (
                    <span key={i} style={{ width: i + 1 === step ? 22 : 7, height: 7, borderRadius: 99, background: i + 1 <= step ? 'var(--accent)' : 'var(--surface-hi)', transition: 'all .25s ease' }} />
                  ))}
                </div>
              )}
              {meta.key !== 'done'
                ? <button onClick={onSkip} style={{ ...ghost, width: 'auto', padding: '0 10px', fontSize: 12.5, color: 'var(--text-3)' }}>Skip all</button>
                : <span style={{ width: 36 }} />}
            </div>
            {meta.key !== 'done' && 'title' in meta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'color-mix(in oklch, var(--accent) 16%, transparent)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                  <Icon name={meta.icon} size={21} />
                </div>
                <div>
                  <h2 style={{ fontSize: 21, letterSpacing: '-0.02em' }}>{meta.title}</h2>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{meta.sub}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 auto', overflowY: 'auto', width: '100%' }}>
            <div style={{ padding: '8px 18px 16px' }} className="onb-col">
            {meta.key === 'income' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>How do you get paid?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {([
                      ['weekly', 'Weekly', 'Same pay every week'],
                      ['fourweek', 'Every 4 weeks', '13 paydays a year'],
                      ['monthly', 'Monthly', 'Once a month'],
                      ['manual', 'Manual / variable', 'You enter it yourself every time money arrives'],
                    ] as const).map(([value, title, sub]) => {
                      const on = draft.salary.cadence === value;
                      return (
                        <button key={value} onClick={() => setSalary('cadence', value)} style={{
                          display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                          padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                          background: on ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'var(--surface)',
                          border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`, color: 'var(--text)',
                        }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: '50%', flex: '0 0 auto', display: 'grid', placeItems: 'center',
                            border: `2px solid ${on ? 'var(--accent)' : 'var(--text-3)'}`,
                          }}>
                            {on && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)' }} />}
                          </span>
                          <span>
                            <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{title}</span>
                            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>{sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {draft.salary.cadence !== 'manual' ? (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>Take-home pay each {CADENCE[draft.salary.cadence].label.toLowerCase()}</div>
                    <MoneyInput value={draft.salary.amount} onChange={(v) => setSalary('amount', v)} />
                    {draft.salary.amount ? <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>≈ {fmtEur(salaryMonthly(draft.salary))} / month</div> : null}
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
                    No fixed amount needed — every time money comes in you press <b style={{ color: 'var(--text)' }}>Add income</b>,
                    and Mintly checks your bills are covered before splitting the rest.
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>Allowances & extras — optional</div>
                  {draft.income.map((x) => (
                    <Row key={x.id} icon="coins" color="var(--accent)" title={x.name || INCOME_KINDS[x.kind].label} meta={x.freq === 'yearly' ? 'yearly' : 'monthly'} amount={'+' + fmtEur(Number(x.amount) || 0)} onRemove={() => removeFrom('income', x.id)} />
                  ))}
                  <QuickAdd canAdd={!!extra.amount} onAdd={() => { if (!extra.amount) return; pushTo('income', { ...extra, id: uid('i'), name: extra.name || INCOME_KINDS[extra.kind].label } as IncomeExtra); setExtra({ kind: 'travel', name: '', amount: '', freq: 'monthly' }); }}>
                    <Select value={extra.kind} onChange={(v) => setExtra({ ...extra, kind: v })} options={Object.entries(INCOME_KINDS).filter(([k]) => k !== 'salary').map(([value, m]) => ({ value, label: m.label }))} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
                      <MoneyInput value={extra.amount} onChange={(v) => setExtra({ ...extra, amount: v })} />
                      <Segmented value={extra.freq} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} onChange={(v) => setExtra({ ...extra, freq: v as 'monthly' | 'yearly' })} />
                    </div>
                  </QuickAdd>
                </div>
              </div>
            )}

            {meta.key === 'expenses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {draft.expenses.map((e) => (
                  <Row key={e.id} catKey={e.category} title={e.name} meta={`${(CATEGORIES[e.category] || CATEGORIES.other).label} · due the ${ordinal(e.payday)}${e.freq && e.freq !== 'monthly' ? ' · ' + EXPENSE_FREQ[e.freq].label.toLowerCase() : ''}`} amount={fmtEur(Number(e.amount) || 0)} onRemove={() => removeFrom('expenses', e.id)} />
                ))}
                <QuickAdd canAdd={!!exp.name && !!exp.amount} onAdd={() => { if (!exp.name || !exp.amount) return; pushTo('expenses', { ...exp, id: uid('e') } as Expense); setExp({ name: '', category: 'housing', amount: '', freq: 'monthly', payday: 1 }); }}>
                  <TextInput value={exp.name} onChange={(v) => setExp({ ...exp, name: v })} placeholder="e.g. Apartment rent" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Select value={exp.category} onChange={(v) => setExp({ ...exp, category: v })} options={Object.entries(CATEGORIES).map(([value, c]) => ({ value, label: c.label }))} />
                    <MoneyInput value={exp.amount} onChange={(v) => setExp({ ...exp, amount: v })} />
                  </div>
                  <Segmented value={exp.freq} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]} onChange={(v) => setExp({ ...exp, freq: v as ExpenseFreq })} />
                  <Select value={String(exp.payday)} onChange={(v) => setExp({ ...exp, payday: Number(v) })} options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: 'Due the ' + ordinal(i + 1) }))} />
                </QuickAdd>
              </div>
            )}

            {meta.key === 'debts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {draft.debts.map((d2) => (
                  <Row key={d2.id} icon="card" color="var(--violet)" title={d2.name} meta={`${fmtEur(Number(d2.monthly) || 0)}/mo${d2.payday ? ' · due the ' + ordinal(d2.payday) : ''}`} amount={fmtEur(Math.max(0, (Number(d2.total) || 0) - (Number(d2.paid) || 0)))} onRemove={() => removeFrom('debts', d2.id)} />
                ))}
                <QuickAdd canAdd={!!debt.name && debt.total !== ''} onAdd={() => { if (!debt.name || debt.total === '') return; pushTo('debts', { ...debt, id: uid('d'), apr: '' } as Debt); setDebt({ name: '', total: '', paid: 0, monthly: '', payday: 1 }); }}>
                  <TextInput value={debt.name} onChange={(v) => setDebt({ ...debt, name: v })} placeholder="e.g. Credit card" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Total owed</div><MoneyInput value={debt.total} onChange={(v) => setDebt({ ...debt, total: v })} /></div>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Paid off</div><MoneyInput value={debt.paid} onChange={(v) => setDebt({ ...debt, paid: v })} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Monthly payment</div><MoneyInput value={debt.monthly} onChange={(v) => setDebt({ ...debt, monthly: v })} /></div>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Paydate</div>
                      <Select value={String(debt.payday)} onChange={(v) => setDebt({ ...debt, payday: Number(v) })}
                        options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: ordinal(i + 1) }))} />
                    </div>
                  </div>
                </QuickAdd>
              </div>
            )}

            {meta.key === 'goals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {draft.goals.map((g) => (
                  <Row key={g.id} icon="target" color="oklch(0.78 0.13 200)" title={g.name} meta={g.deadline ? 'by ' + fmtMonth(new Date(g.deadline)) : 'no deadline'} amount={fmtEur(Number(g.target) || 0)} onRemove={() => removeFrom('goals', g.id)} />
                ))}
                <QuickAdd canAdd={!!goal.name && !!goal.target} onAdd={() => { if (!goal.name || !goal.target) return; pushTo('goals', { ...goal, id: uid('g'), priority: draft.goals.length + 1 } as Goal); setGoal({ name: '', target: '', saved: 0, deadline: '' }); }}>
                  <TextInput value={goal.name} onChange={(v) => setGoal({ ...goal, name: v })} placeholder="e.g. Emergency buffer" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Target</div><MoneyInput value={goal.target} onChange={(v) => setGoal({ ...goal, target: v })} /></div>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Saved</div><MoneyInput value={goal.saved} onChange={(v) => setGoal({ ...goal, saved: v })} /></div>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>Deadline</div>
                    <Segmented value={goal.deadline ? 'yes' : 'no'} options={[{ value: 'no', label: 'None' }, { value: 'yes', label: 'By a date' }]} onChange={(v) => setGoal({ ...goal, deadline: v === 'yes' ? nextYear() : '' })} />
                    {goal.deadline ? <div style={{ marginTop: 10 }}><DateInput value={goal.deadline} onChange={(v) => setGoal({ ...goal, deadline: v })} /></div> : null}
                  </div>
                </QuickAdd>
              </div>
            )}

            {meta.key === 'done' && <Done draft={draft} />}
            </div>
          </div>

          <div style={{ flex: '0 0 auto', borderTop: '1px solid var(--line)', width: '100%' }}>
            <div style={{ padding: '12px 18px calc(16px + env(safe-area-inset-bottom))', display: 'flex', gap: 10 }} className="onb-col">
              {meta.key === 'done'
                ? <Btn variant="primary" icon="check" onClick={() => onFinish(draft)} style={{ flex: 1, justifyContent: 'center', padding: 13 }}>Enter Mintly</Btn>
                : <Btn variant="primary" onClick={next} style={{ flex: 1, justifyContent: 'center', padding: 13 }}>Step {step} of {INPUT_STEPS} · Continue</Btn>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const ghost: CSSProperties = { width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text-2)' };

function Welcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="onb-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 26px calc(28px + env(safe-area-inset-bottom))', textAlign: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 22 }}>
        <img src={logoUrl} alt="Mintly" style={{ height: 54, filter: 'drop-shadow(0 12px 30px color-mix(in oklch, var(--accent) 40%, transparent))' }} />
        <div>
          <h1 style={{ fontSize: 30, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Let's build your<br />budget plan</h1>
          <p style={{ fontSize: 14.5, color: 'var(--text-2)', marginTop: 14, lineHeight: 1.55, maxWidth: 320 }}>
            Tell Mintly what comes in and what goes out. It splits every euro across your bills, debts and goals — and pays the rest to you.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 6 }}>
          {[['coins', 'Income'], ['cart', 'Expenses'], ['card', 'Debts'], ['target', 'Goals']].map(([ic, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, textAlign: 'left' }}>
              <Icon name={ic} size={18} stroke="var(--accent)" />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Btn variant="primary" onClick={onStart} style={{ justifyContent: 'center', padding: 14, fontSize: 15 }}>Get started</Btn>
        <button onClick={onSkip} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, padding: 6 }}>Skip — I'll add things later</button>
      </div>
    </div>
  );
}

function Done({ draft }: { draft: AppState }) {
  const b = computeBudget(draft);
  const manual = draft.salary.cadence === 'manual';
  const rows = manual
    ? [
        { label: 'Monthly income', v: null as number | null, text: 'variable', color: 'var(--accent)' },
        { label: 'Fixed expenses', v: b.expensesTotal },
        { label: 'Debt payments', v: b.debtTotal },
        { label: 'Goal targets', v: draft.goals.reduce((s, g) => s + (Number(g.target) || 0), 0), color: 'oklch(0.78 0.13 200)' },
      ]
    : [
        { label: 'Monthly income', v: b.incomeTotal, color: 'var(--accent)' },
        { label: 'Fixed expenses', v: b.expensesTotal },
        { label: 'Debt payments', v: b.debtTotal },
        { label: 'Toward dated goals', v: b.savingsTotal, color: 'oklch(0.78 0.13 200)' },
      ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 8 }}>
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'color-mix(in oklch, var(--accent) 18%, transparent)', color: 'var(--accent)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><Icon name="check" size={28} /></div>
        <h2 style={{ fontSize: 23, letterSpacing: '-0.02em' }}>You're all set</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', marginTop: 6 }}>
          {manual
            ? 'Every time money arrives, press "Add income" — Mintly covers your bills first and splits the rest.'
            : "Here's your starting plan. You can change anything later."}
        </p>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>{manual ? 'Bills to cover each month' : 'Left over to allocate each month'}</div>
        <div className="num" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', color: manual ? 'var(--text)' : b.leftover < 0 ? 'var(--rose)' : 'var(--accent)' }}>
          {fmtEur(manual ? b.expensesTotal + b.debtTotal : b.leftover)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-2)' }}>{r.label}</span>
              <span className="num mono" style={{ color: r.color || 'var(--text)' }}>{'text' in r && r.text ? r.text : fmtEur(r.v as number)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickAdd({ children, onAdd, canAdd }: { children: ReactNode; onAdd: () => void; canAdd: boolean }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px dashed var(--line)', borderRadius: 'var(--r)', padding: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
      {children}
      <Btn variant="ghost" icon="plus" onClick={onAdd} disabled={!canAdd} style={{ justifyContent: 'center' }}>Add</Btn>
    </div>
  );
}

function Row({ icon, color, catKey, cats, title, meta, amount, onRemove }: {
  icon?: string; color?: string; catKey?: string; cats?: typeof CATEGORIES; title: string; meta: string; amount: string; onRemove: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 8 }}>
      {catKey
        ? <CatDot category={catKey} cats={cats} size={34} />
        : <div style={{ width: 34, height: 34, borderRadius: 9, background: `color-mix(in oklch, ${color} 16%, transparent)`, color, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name={icon as string} size={17} /></div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{meta}</div>
      </div>
      <span className="num mono" style={{ fontSize: 14 }}>{amount}</span>
      <button onClick={onRemove} style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-3)', flex: '0 0 auto' }}><Icon name="trash" size={14} /></button>
    </div>
  );
}
