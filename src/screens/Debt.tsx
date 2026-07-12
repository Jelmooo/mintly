import { useEffect, useState } from 'react';
import type { AppState, Debt as DebtT } from '../types';
import { type Budget, fmtEur, fmtMonth, NOW } from '../engine';
import { Bar, Btn, Card, Empty, Field, Icon, IconBtn, MoneyInput, PageHead, Pill, Sheet, StatRow, TextInput } from '../ui';

type Upd = (u: Partial<AppState> | ((s: AppState) => AppState)) => void;

export function Debt({ state, b, update }: { state: AppState; b: Budget; update: Upd }) {
  const [edit, setEdit] = useState<DebtT | null>(null);

  function save(item: DebtT) {
    if (item.id) update((s) => ({ ...s, debts: s.debts.map((x) => (x.id === item.id ? item : x)) }));
    else update((s) => ({ ...s, debts: [...s.debts, { ...item, id: 'd' + Date.now(), start: Number(item.balance) || 0 }] }));
    setEdit(null);
  }
  const del = (id: string) => update((s) => ({ ...s, debts: s.debts.filter((x) => x.id !== id) }));

  const totalBal = state.debts.reduce((s, d) => s + (Number(d.balance) || 0), 0);
  const totalStart = state.debts.reduce((s, d) => s + (Number(d.start) || Number(d.balance) || 0), 0);
  const paidPct = totalStart ? (totalStart - totalBal) / totalStart * 100 : 0;

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead title="Debt" sub="Pay down balances with steady monthly payments from your main account."
        action={<Btn variant="primary" icon="plus" onClick={() => setEdit({ id: '', name: '', start: 0, balance: '', monthly: '', apr: '' })}>Add</Btn>} />

      <StatRow items={[
        { label: 'Total owed', value: fmtEur(totalBal), color: 'var(--violet)' },
        { label: 'Paid off', value: Math.round(paidPct) + '%', sub: fmtEur(totalStart - totalBal) + ' of ' + fmtEur(totalStart) },
        { label: 'Monthly', value: fmtEur(b.debtTotal) },
      ]} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {state.debts.length === 0 && <Card><Empty label="No debts tracked. Nice. 🎉" /></Card>}
        {state.debts.map((d) => {
          const start = Number(d.start) || Number(d.balance) || 0;
          const bal = Number(d.balance) || 0;
          const paid = Math.max(0, start - bal);
          const pct = start ? paid / start * 100 : 0;
          const monthly = Number(d.monthly) || 0;
          const months = monthly > 0 ? Math.ceil(bal / monthly) : Infinity;
          const payoff = isFinite(months) ? new Date(NOW.getFullYear(), NOW.getMonth() + months, NOW.getDate()) : null;
          return (
            <Card key={d.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: 'color-mix(in oklch, var(--violet) 16%, transparent)', color: 'var(--violet)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name="card" size={21} /></div>
                  <div>
                    <h3 style={{ fontSize: 16 }}>{d.name}</h3>
                    <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                      {d.apr ? <Pill color="var(--amber)">{d.apr}% APR</Pill> : null}
                      {payoff && <Pill color="var(--text-2)"><Icon name="cal" size={11} /> clear {fmtMonth(payoff)}</Pill>}
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
                  <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em' }}>{fmtEur(bal)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="eyebrow">Paying</div>
                  <div className="num mono" style={{ fontSize: 16, color: 'var(--violet)' }}>{fmtEur(monthly)}/mo</div>
                </div>
              </div>
              <Bar pct={pct} color="var(--violet)" h={10} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
                <span className="num mono">{fmtEur(paid)} paid ({Math.round(pct)}%)</span>
                <span className="num mono">started at {fmtEur(start)}</span>
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
  return (
    <Sheet open={!!item} onClose={onClose} title={isNew ? 'Add debt' : 'Edit debt'}
      footer={<>
        <Btn variant="dim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" onClick={() => onSave(d)} disabled={!d.name || d.balance === ''}>Save</Btn>
      </>}>
      <Field label="Name"><TextInput value={d.name} onChange={(v) => set('name', v)} placeholder="e.g. Credit card" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Current balance"><MoneyInput value={d.balance} onChange={(v) => set('balance', v)} /></Field>
        <Field label="Monthly payment"><MoneyInput value={d.monthly} onChange={(v) => set('monthly', v)} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {!isNew && <Field label="Original balance" hint="For paid-down %"><MoneyInput value={d.start} onChange={(v) => set('start', v)} /></Field>}
        <Field label="Interest (APR %)" hint="Optional"><MoneyInput prefix="%" value={d.apr ?? ''} onChange={(v) => set('apr', v)} /></Field>
      </div>
    </Sheet>
  );
}
