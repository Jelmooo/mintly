import { useEffect, useState } from 'react';
import type { AppState, IncomeExtra } from '../types';
import { type Budget, CADENCE, extraMonthly, fmtEur, INCOME_KINDS, salaryMonthly, uid } from '../engine';
import { Btn, Card, Empty, Field, Icon, IconBtn, MoneyInput, PageHead, Segmented, Select, Sheet, TextInput } from '../ui';

type Upd = (u: Partial<AppState> | ((s: AppState) => AppState)) => void;

export function Income({ state, b, update }: { state: AppState; b: Budget; update: Upd }) {
  const [edit, setEdit] = useState<IncomeExtra | null>(null);
  const sal = state.salary;
  const salM = salaryMonthly(sal);

  function saveExtra(item: IncomeExtra) {
    if (item.id) update((s) => ({ ...s, income: s.income.map((x) => (x.id === item.id ? item : x)) }));
    else update((s) => ({ ...s, income: [...s.income, { ...item, id: uid('i') }] }));
    setEdit(null);
  }
  const delExtra = (id: string) => update((s) => ({ ...s, income: s.income.filter((x) => x.id !== id) }));

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead title="Income" sub="Set how you're paid, then add allowances and extras." />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'color-mix(in oklch, var(--accent) 16%, transparent)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}><Icon name="wallet" size={20} /></div>
            <h3 style={{ fontSize: 17 }}>Salary</h3>
          </div>
          <Segmented value={sal.cadence}
            options={[{ value: 'weekly', label: 'Weekly' }, { value: 'fourweek', label: '4-weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'manual', label: 'Manual' }]}
            onChange={(c) => update((s) => ({ ...s, salary: { ...s.salary, cadence: c } }))} />
        </div>
        {sal.cadence === 'manual' ? (
          <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--r)', padding: 20 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Icon name="coins" size={20} style={{ color: 'var(--accent)' }} />
              <b style={{ fontSize: 15 }}>Variable income</b>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '8px 0 0', lineHeight: 1.5 }}>
              You enter your income each time it arrives — press <b style={{ color: 'var(--text)' }}>Add income</b> on
              the Home tab. Mintly first checks that your bills and debts are covered, then helps you split
              what's left. Allowances below still count monthly.
            </p>
          </div>
        ) : (
        <div className="grid2 inc" style={{ gap: 22 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Amount per {CADENCE[sal.cadence].label.toLowerCase()} pay</div>
            <MoneyInput value={sal.amount} onChange={(v) => update((s) => ({ ...s, salary: { ...s.salary, amount: v } }))} style={{ maxWidth: 260 }} />
            <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap' }}>
              {Object.entries(CADENCE).filter(([, c]) => c.perMonth > 0).map(([k, c]) => (
                <div key={k} style={{ opacity: k === sal.cadence ? 1 : 0.5 }}>
                  <div className="eyebrow" style={{ fontSize: 10 }}>per {c.short}</div>
                  <div className="num mono" style={{ fontSize: 14, marginTop: 2 }}>{fmtEur(salM / c.perMonth)}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--r)', padding: 20, textAlign: 'center' }}>
            <div className="eyebrow">Monthly equivalent</div>
            <div className="num" style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--accent)', marginTop: 8 }}>{fmtEur(salM)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Everything is normalized to a month so your budget stays steady.</div>
          </div>
        </div>
        )}
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 17 }}>Allowances & extras</h3>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>Yearly items (bonus, vacation money) are spread across the year.</div>
          </div>
          <Btn variant="primary" size="sm" icon="plus" onClick={() => setEdit({ id: '', kind: 'travel', name: '', amount: '', freq: 'monthly' })}>Add</Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line-2)', borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--line)' }}>
          {state.income.length === 0 && <Empty label="No extras yet — add travel allowance, bonus, etc." />}
          {state.income.map((x) => {
            const m = extraMonthly(x);
            return (
              <div key={x.id} style={{ background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name="coins" size={17} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.name || INCOME_KINDS[x.kind].label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{INCOME_KINDS[x.kind].label} · {x.freq === 'yearly' ? 'yearly' : 'monthly'}</div>
                </div>
                <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                  <div className="num mono" style={{ fontSize: 14, color: 'var(--accent)' }}>+{fmtEur(Number(x.amount) || 0)}{x.freq === 'yearly' ? '/yr' : '/mo'}</div>
                  {x.freq === 'yearly' && <div className="num mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>≈ {fmtEur(m)}/mo</div>}
                </div>
                <div style={{ display: 'flex', gap: 4, flex: '0 0 auto' }}>
                  <IconBtn name="card" onClick={() => setEdit(x)} title="Edit" />
                  <IconBtn name="trash" onClick={() => delExtra(x.id)} title="Delete" danger />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          <span style={{ color: 'var(--text-2)', fontSize: 14 }}>Total monthly income</span>
          <span className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--accent)' }}>{fmtEur(b.incomeTotal)}</span>
        </div>
      </Card>

      <ExtraSheet item={edit} onClose={() => setEdit(null)} onSave={saveExtra} />
    </div>
  );
}

function ExtraSheet({ item, onClose, onSave }: { item: IncomeExtra | null; onClose: () => void; onSave: (i: IncomeExtra) => void }) {
  const [d, setD] = useState<IncomeExtra | null>(item);
  useEffect(() => setD(item), [item]);
  if (!d) return null;
  const set = (k: keyof IncomeExtra, v: unknown) => setD({ ...d, [k]: v } as IncomeExtra);
  return (
    <Sheet open={!!item} onClose={onClose} title={item && item.id ? 'Edit income' : 'Add income'}
      footer={<>
        <Btn variant="dim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" onClick={() => onSave(d)} disabled={!d.amount}>Save</Btn>
      </>}>
      <Field label="Type">
        <Select value={d.kind} onChange={(v) => set('kind', v)}
          options={Object.entries(INCOME_KINDS).filter(([k]) => k !== 'salary').map(([value, m]) => ({ value, label: m.label }))} />
      </Field>
      <Field label="Label (optional)">
        <TextInput value={d.name} onChange={(v) => set('name', v)} placeholder={INCOME_KINDS[d.kind].label} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Amount"><MoneyInput value={d.amount} onChange={(v) => set('amount', v)} /></Field>
        <Field label="Frequency">
          <Segmented value={d.freq} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} onChange={(v) => set('freq', v)} />
        </Field>
      </div>
    </Sheet>
  );
}
