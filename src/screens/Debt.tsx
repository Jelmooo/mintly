import { useEffect, useState } from 'react';
import type { AppState, Debt as DebtT } from '../types';
import { type Budget, debtRemaining, fmtEur, fmtMonth, NOW, ordinal } from '../engine';
import { Bar, Btn, Card, Empty, Field, Icon, IconBtn, MoneyInput, PageHead, Pill, Select, Sheet, StatRow, TextInput } from '../ui';

type Upd = (u: Partial<AppState> | ((s: AppState) => AppState)) => void;
const n = (v: unknown) => Number(v) || 0;

export function Debt({ state, b, update }: { state: AppState; b: Budget; update: Upd }) {
  const [edit, setEdit] = useState<DebtT | null>(null);

  function save(item: DebtT) {
    if (item.id) update((s) => ({ ...s, debts: s.debts.map((x) => (x.id === item.id ? item : x)) }));
    else update((s) => ({ ...s, debts: [...s.debts, { ...item, id: 'd' + Date.now() }] }));
    setEdit(null);
  }
  const del = (id: string) => update((s) => ({ ...s, debts: s.debts.filter((x) => x.id !== id) }));

  const totalOwed = state.debts.reduce((s, d) => s + debtRemaining(d), 0);
  const totalStart = state.debts.reduce((s, d) => s + n(d.total), 0);
  const totalPaid = state.debts.reduce((s, d) => s + Math.min(n(d.paid), n(d.total)), 0);
  const paidPct = totalStart ? (totalPaid / totalStart) * 100 : 0;

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead title="Debt" sub="Enter the total and what you've paid — the remainder is worked out for you."
        action={<Btn variant="primary" icon="plus" onClick={() => setEdit({ id: '', name: '', total: '', paid: 0, monthly: '', apr: '', payday: 1 })}>Add</Btn>} />

      <StatRow items={[
        { label: 'Total owed', value: fmtEur(totalOwed), color: 'var(--violet)' },
        { label: 'Paid off', value: Math.round(paidPct) + '%', sub: fmtEur(totalPaid) + ' of ' + fmtEur(totalStart) },
        { label: 'Monthly', value: fmtEur(b.debtTotal) },
      ]} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {state.debts.length === 0 && <Card><Empty label="No debts tracked. Nice. 🎉" /></Card>}
        {state.debts.map((d) => {
          const total = n(d.total);
          const remaining = debtRemaining(d);
          const paid = Math.min(n(d.paid), total);
          const pct = total ? (paid / total) * 100 : 0;
          const monthly = n(d.monthly);
          const months = monthly > 0 ? Math.ceil(remaining / monthly) : Infinity;
          const payoff = isFinite(months) && remaining > 0 ? new Date(NOW.getFullYear(), NOW.getMonth() + months, NOW.getDate()) : null;
          return (
            <Card key={d.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: 'color-mix(in oklch, var(--violet) 16%, transparent)', color: 'var(--violet)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name="card" size={21} /></div>
                  <div>
                    <h3 style={{ fontSize: 16 }}>{d.name}</h3>
                    <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                      {d.payday ? <Pill color="var(--text-2)">due {ordinal(d.payday)}</Pill> : null}
                      {d.apr ? <Pill color="var(--amber)">{d.apr}% APR</Pill> : null}
                      {payoff ? <>
                        <Pill color="var(--text-2)"><Icon name="card" size={11} /> {months} payment{months === 1 ? '' : 's'} left</Pill>
                        <Pill color="var(--text-2)"><Icon name="cal" size={11} /> clear {fmtMonth(payoff)}</Pill>
                      </>
                        : remaining <= 0 ? <Pill color="var(--accent)"><Icon name="check" size={11} /> paid off</Pill> : null}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
                  <IconBtn name="card" onClick={() => setEdit(d)} title="Edit" />
                  <IconBtn name="trash" onClick={() => del(d.id)} title="Delete" danger />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 9 }}>
                <div>
                  <div className="eyebrow">Remaining</div>
                  <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em' }}>{fmtEur(remaining)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="eyebrow">Paying</div>
                  <div className="num mono" style={{ fontSize: 16, color: 'var(--violet)' }}>{fmtEur(monthly)}/mo</div>
                </div>
              </div>
              <Bar pct={pct} color="var(--violet)" h={10} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
                <span className="num mono">{fmtEur(paid)} paid ({Math.round(pct)}%)</span>
                <span className="num mono">of {fmtEur(total)} total</span>
              </div>
            </Card>
          );
        })}
      </div>

      <DebtSheet item={edit} onClose={() => setEdit(null)} onSave={save} />
    </div>
  );
}

function DebtSheet({ item, onClose, onSave }: { item: DebtT | null; onClose: () => void; onSave: (d: DebtT) => void }) {
  const [d, setD] = useState<DebtT | null>(item);
  useEffect(() => setD(item), [item]);
  if (!d) return null;
  const set = (k: keyof DebtT, v: unknown) => setD({ ...d, [k]: v } as DebtT);
  const isNew = !item?.id;

  const total = n(d.total);
  const paid = n(d.paid);
  const remaining = Math.max(0, total - paid);
  const overpaid = paid > total + 0.005;

  return (
    <Sheet open={!!item} onClose={onClose} title={isNew ? 'Add debt' : 'Edit debt'}
      footer={<>
        <Btn variant="dim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" onClick={() => onSave(d)} disabled={!d.name || d.total === '' || overpaid}>Save</Btn>
      </>}>
      <Field label="Name"><TextInput value={d.name} onChange={(v) => set('name', v)} placeholder="e.g. Credit card" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Total amount owed"><MoneyInput value={d.total} onChange={(v) => set('total', v)} /></Field>
        <Field label="Paid off so far"><MoneyInput value={d.paid} onChange={(v) => set('paid', v)} /></Field>
      </div>

      {/* auto-calculated remainder */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 14px', borderRadius: 12, marginBottom: 14,
        background: overpaid ? 'color-mix(in oklch, var(--rose) 12%, transparent)' : 'var(--bg-2)',
        border: `1px solid ${overpaid ? 'color-mix(in oklch, var(--rose) 40%, transparent)' : 'var(--line)'}`,
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{overpaid ? 'Paid is more than the total' : 'Remaining (auto)'}</span>
        <span className="num mono" style={{ fontSize: 17, fontWeight: 600, color: overpaid ? 'var(--rose)' : 'var(--violet)' }}>{fmtEur(remaining)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Monthly payment"><MoneyInput value={d.monthly} onChange={(v) => set('monthly', v)} /></Field>
        <Field label="Paydate" hint="Day it's due">
          <Select value={String(d.payday ?? 1)} onChange={(v) => set('payday', Number(v))}
            options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: ordinal(i + 1) }))} />
        </Field>
      </div>
      <Field label="Interest (APR %)" hint="Optional"><MoneyInput prefix="%" value={d.apr ?? ''} onChange={(v) => set('apr', v)} /></Field>
    </Sheet>
  );
}
