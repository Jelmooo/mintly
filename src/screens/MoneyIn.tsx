import { useMemo, useState } from 'react';
import type { AppState, MoneyEvent } from '../types';
import { type Budget, CADENCE, computeBudget, fmtEur, uid } from '../engine';
import { Btn, Field, Icon, MoneyInput, Sheet, TextInput } from '../ui';

type Upd = (u: Partial<AppState> | ((s: AppState) => AppState)) => void;
type Kind = 'salary' | 'extra';

interface Target { key: string; label: string; hint?: string }

const r2 = (n: number) => Math.round(n * 100) / 100;

export function MoneyIn({ kind, state, update, onClose }: { kind: Kind; state: AppState; update: Upd; onClose: () => void }) {
  const b = useMemo(() => computeBudget(state), [state]);
  const perMonth = CADENCE[state.salary.cadence].perMonth;
  const pp = (monthly: number) => monthly / perMonth;
  const expectedSalary = r2(pp(b.salM));

  const [step, setStep] = useState(0);
  const [mainBal, setMainBal] = useState<number | ''>(
    kind === 'salary' ? r2(state.mainBalance + expectedSalary) : state.mainBalance,
  );
  const [savBal, setSavBal] = useState<number | ''>(state.savingsBalance);
  const [extraAmt, setExtraAmt] = useState<number | ''>('');
  const [label, setLabel] = useState(kind === 'salary' ? 'Salary' : 'Gift');
  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const [transfers, setTransfers] = useState<null | { savings: number; personal: number; debts: { name: string; v: number }[]; main: number }>(null);

  const amount = kind === 'extra' ? (Number(extraAmt) || 0) : (Number(mainBal) || 0);
  const targets = useMemo<Target[]>(() => buildTargets(kind, state, b), [kind, state, b]);

  function suggest(): Record<string, number> {
    const out: Record<string, number> = {};
    let leftover = amount;
    const give = (key: string, want: number) => {
      const x = Math.min(Math.max(0, r2(want)), r2(leftover));
      if (x > 0.004) { out[key] = r2((out[key] || 0) + x); leftover = r2(leftover - x); }
    };
    if (kind === 'salary') {
      give('bills', pp(b.expensesTotal + b.debtTotal));
      for (const g of b.dated) give('goal-' + g.id, pp(g.funded));
      give('pers', pp(b.personalBudgetsTotal));
      if (b.topOpen) give('goal-' + b.topOpen.id, pp(b.sweep));
    } else {
      for (const g of b.goals) if (g.hasDeadline && !g.onTrack) give('goal-' + g.id, g.remaining);
      for (const g of b.goals) give('goal-' + g.id, g.remaining - (out['goal-' + g.id] || 0));
    }
    give('free', leftover);
    return out;
  }

  const allocated = r2(targets.reduce((s, t) => s + (alloc[t.key] || 0), 0));
  const left = r2(amount - allocated);
  const canConfirm = Math.abs(left) < 0.005 && amount > 0;

  function toStep1() { setAlloc(suggest()); setStep(1); }

  function apply() {
    const lines = targets.map((t) => ({ key: t.key, name: t.label, amount: alloc[t.key] || 0 })).filter((l) => l.amount > 0);
    const goalSum = lines.filter((l) => l.key.startsWith('goal-')).reduce((s, l) => s + l.amount, 0);
    const free = alloc['free'] || 0;
    const pers = alloc['pers'] || 0;
    const debtLines = state.debts
      .filter((d) => (alloc['debt-' + d.id] || 0) > 0)
      .map((d) => ({ name: d.name, v: alloc['debt-' + d.id] }));
    const debtSum = debtLines.reduce((s, d) => s + d.v, 0);
    const toSavings = r2(goalSum + free);
    const newMain = r2(amount - toSavings - pers - debtSum);
    const newSavings = r2((Number(savBal) || 0) + free);

    update((s) => {
      const goals = s.goals.map((g) => {
        const x = alloc['goal-' + g.id] || 0;
        return x > 0 ? { ...g, saved: r2((Number(g.saved) || 0) + x) } : g;
      });
      const debts = s.debts.map((d) => {
        const x = alloc['debt-' + d.id] || 0;
        return x > 0 ? { ...d, balance: r2(Math.max(0, (Number(d.balance) || 0) - x)) } : d;
      });
      const event: MoneyEvent = { id: uid('ev'), date: new Date().toISOString(), kind, label, amount, lines };
      return { ...s, goals, debts, mainBalance: newMain, savingsBalance: newSavings, events: [...s.events, event] };
    });

    setTransfers({ savings: toSavings, personal: pers, debts: debtLines, main: newMain });
    setStep(2);
  }

  const title = kind === 'salary' ? '💰 Salary in' : '🎁 Extra money in';

  return (
    <Sheet open onClose={step === 1 ? () => undefined : onClose} title={title}
      footer={step === 2 ? <Btn variant="primary" icon="check" onClick={onClose}>Done</Btn> : undefined}>
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {kind === 'salary'
            ? <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 0, lineHeight: 1.5 }}>Got paid? 🎉 Check your balances and we'll show exactly how to split it — keeping enough on your main account for the bills.</p>
            : <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 0, lineHeight: 1.5 }}>Nice! 🥳 Tell us the amount and we'll suggest where it should go.</p>}
          {kind === 'extra' && (
            <>
              <Field label="What is it?"><TextInput value={label} onChange={setLabel} placeholder="e.g. birthday, tax refund" /></Field>
              <Field label="Amount received"><MoneyInput value={extraAmt} onChange={setExtraAmt} /></Field>
            </>
          )}
          <Field label={`Balance on ${state.meta.mainName} now`} hint={kind === 'salary' ? 'Prefilled with your expected pay added' : undefined}>
            <MoneyInput value={mainBal} onChange={setMainBal} />
          </Field>
          <Field label="Free savings balance now"><MoneyInput value={savBal} onChange={setSavBal} /></Field>
          <Btn variant="primary" style={{ justifyContent: 'center', padding: '13px' }} disabled={amount <= 0} onClick={toStep1}>
            Distribute {fmtEur(amount)} →
          </Btn>
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            position: 'sticky', top: 0, zIndex: 2, textAlign: 'center', padding: '10px 12px', borderRadius: 10,
            background: 'var(--bg-2)',
            border: `1px solid ${Math.abs(left) < 0.005 ? 'var(--accent)' : left < 0 ? 'var(--rose)' : 'var(--line)'}`,
            color: Math.abs(left) < 0.005 ? 'var(--accent)' : left < 0 ? 'var(--rose)' : 'var(--text)', fontSize: 14,
          }}>
            {Math.abs(left) < 0.005 ? '✨ Every euro has a job!' : left > 0 ? <>Left to allocate: <b className="num mono">{fmtEur(left)}</b></> : <>Over by <b className="num mono">{fmtEur(-left)}</b></>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {targets.map((t) => (
              <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--line-2)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</div>
                  {t.hint && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.hint}</div>}
                </div>
                <MoneyInput value={alloc[t.key] ?? 0} onChange={(n) => setAlloc((a) => ({ ...a, [t.key]: Number(n) || 0 }))} style={{ width: 120, flex: '0 0 auto' }} align="right" />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {left > 0.004 && <Btn variant="ghost" onClick={() => setAlloc((a) => ({ ...a, free: r2((a.free || 0) + left) }))}>Rest → free savings</Btn>}
            <Btn variant="dim" onClick={() => setAlloc(suggest())}>↻ Re-suggest</Btn>
            <Btn variant="primary" icon="check" disabled={!canConfirm} onClick={apply}>Allocate</Btn>
          </div>
        </div>
      )}

      {step === 2 && transfers && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>🎉 Done! Make these transfers:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transfers.savings > 0 && <TransferRow icon="target" label="To your savings" v={transfers.savings} />}
            {transfers.personal > 0 && <TransferRow icon="user" label={`To ${state.meta.personalName}`} v={transfers.personal} />}
            {transfers.debts.map((d) => <TransferRow key={d.name} icon="card" label={`Extra payoff: ${d.name}`} v={d.v} />)}
            <TransferRow icon="wallet" label={`Keep on ${state.meta.mainName}`} v={transfers.main} dashed />
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0 }}>Enough stays on your main account for the bills, and your goals are updated. 💪</p>
        </div>
      )}
    </Sheet>
  );
}

function TransferRow({ icon, label, v, dashed }: { icon: string; label: string; v: number; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: 'var(--bg-2)', border: `1px ${dashed ? 'dashed' : 'solid'} var(--line)`, borderRadius: 12 }}>
      <Icon name={icon} size={17} stroke="var(--accent)" />
      <span style={{ flex: 1, fontSize: 13.5 }}>{label}</span>
      <span className="num mono" style={{ fontSize: 14.5, color: 'var(--accent)' }}>{fmtEur(v)}</span>
    </div>
  );
}

function buildTargets(kind: Kind, state: AppState, b: Budget): Target[] {
  const t: Target[] = [];
  if (kind === 'salary') {
    t.push({ key: 'bills', label: `Keep on ${state.meta.mainName}`, hint: 'fixed expenses + debt' });
    for (const g of b.dated) t.push({ key: 'goal-' + g.id, label: g.name, hint: 'dated goal' });
    t.push({ key: 'pers', label: `Pay yourself → ${state.meta.personalName}`, hint: 'spending budgets' });
    if (b.topOpen) t.push({ key: 'goal-' + b.topOpen.id, label: b.topOpen.name, hint: 'catches the rest' });
  } else {
    for (const g of b.goals) if (Number(g.saved) < Number(g.target)) t.push({ key: 'goal-' + g.id, label: g.name, hint: g.hasDeadline ? 'dated goal' : 'goal' });
    for (const d of state.debts) if (Number(d.balance) > 0) t.push({ key: 'debt-' + d.id, label: 'Extra payoff: ' + d.name, hint: 'reduce debt' });
  }
  t.push({ key: 'free', label: 'Free savings', hint: 'buffer with no goal' });
  return t;
}
