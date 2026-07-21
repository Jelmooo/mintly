import { useMemo, useState } from 'react';
import type { AppState, MoneyEvent } from '../types';
import { CADENCE, fmtEur, ordinal, periodEssentials, uid } from '../engine';
import { Btn, DateInput, Field, Icon, MoneyInput, Sheet, TextInput } from '../ui';

type Upd = (u: Partial<AppState> | ((s: AppState) => AppState)) => void;

const r2 = (v: number) => Math.round(v * 100) / 100;
const TEAL = 'var(--teal)';

/** Today's date as a local yyyy-mm-dd string. */
function todayISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Income prefill according to the payment-tracking setting. */
function prefillIncome(state: AppState): { value: number | ''; hint?: string } {
  const mode = state.settings?.tracking ?? 'fixed';
  if (mode === 'manual') return { value: '' };
  if (mode === 'fixed') {
    const v = state.salary.cadence !== 'manual' ? state.salary.amount : '';
    return { value: v, hint: v !== '' ? 'Fixed amount from your salary — change the mode in Settings.' : undefined };
  }
  // estimate: average of the last 3 incomes, overridable
  const recent = state.events.filter((e) => e.kind === 'income' || e.kind === 'salary').slice(-3);
  if (recent.length > 0) {
    const avg = r2(recent.reduce((s, e) => s + e.amount, 0) / recent.length);
    return { value: avg, hint: `Estimated from your last ${recent.length} income${recent.length > 1 ? 's' : ''} — adjust if it's different this time.` };
  }
  const v = state.salary.cadence !== 'manual' ? state.salary.amount : '';
  return { value: v, hint: v !== '' ? 'No history yet — estimated from your salary.' : undefined };
}

/**
 * Prioritized allocation engine — strictly per period:
 *  0. balance check + income input
 *  1. cover the essentials due THIS period and show coverage
 *  2. show "what's left" and ask about saving
 *  3. optional savings allocation with goal-accuracy integrity check
 *  4. summary + apply
 */
export function MoneyIn({ state, update, onClose }: { state: AppState; update: Upd; onClose: () => void }) {
  const scheduled = state.salary.cadence !== 'manual';
  const prefill = useMemo(() => prefillIncome(state), [state]);

  const expectedIncome = prefill.value === '' ? 0 : Number(prefill.value);
  const [step, setStep] = useState(0);
  const [label, setLabel] = useState(scheduled ? 'Salary' : 'Income');
  // Payslip date — defaults to today, editable if you enter it a few days late.
  const [payDate, setPayDate] = useState(todayISO());
  // Bills "due this period" are measured from the payslip date, not from today.
  const pe = useMemo(() => periodEssentials(state, new Date(payDate + 'T12:00:00')), [state, payDate]);
  const essentials = r2(pe.total);
  // Current balance = what the bank shows now, i.e. old balance + this income.
  const [mainBal, setMainBal] = useState<number | ''>(r2((state.mainBalance || 0) + expectedIncome) || '');
  const [amount, setAmount] = useState<number | ''>(prefill.value);
  /** Corrected goal baselines (integrity check) — goal id → amount. */
  const [baseline, setBaseline] = useState<Record<string, number | ''>>({});
  /** New deposits per goal. */
  const [dep, setDep] = useState<Record<string, number | ''>>({});
  /** Corrected pot baselines + new deposits per pot. */
  const [potBase, setPotBase] = useState<Record<string, number | ''>>({});
  const [potDep, setPotDep] = useState<Record<string, number | ''>>({});
  const [result, setResult] = useState<null | {
    keepOnMain: number; toSavings: { name: string; v: number; icon: string }[]; priv: number; covered: boolean;
  }>(null);

  // The current balance already includes this income — it IS the total to split.
  const total = r2(Number(mainBal) || 0);
  const covered = total >= essentials - 0.005;
  const leftover = r2(Math.max(0, total - essentials));
  const openGoals = [...state.goals]
    .sort((a, c) => a.priority - c.priority)
    .filter((g) => Number(g.target) > 0);
  const pots = state.pots || [];
  const canSetAside = openGoals.length > 0 || pots.length > 0;
  const depSum = r2(openGoals.reduce((s, g) => s + (Number(dep[g.id]) || 0), 0));
  const potDepSum = r2(pots.reduce((s, p) => s + (Number(potDep[p.id]) || 0), 0));
  const remaining = r2(leftover - depSum - potDepSum);

  const goalBaseline = (id: string) => {
    const g = state.goals.find((x) => x.id === id)!;
    return baseline[id] !== undefined && baseline[id] !== '' ? Number(baseline[id]) : Number(g.saved) || 0;
  };
  const potBaseline = (id: string) => {
    const p = pots.find((x) => x.id === id)!;
    return potBase[id] !== undefined && potBase[id] !== '' ? Number(potBase[id]) : Number(p.balance) || 0;
  };

  /** Suggest topping up each pot by its per-period share, greedily within leftover. */
  function suggestPots() {
    const perMonth = CADENCE[state.salary.cadence].perMonth;
    let leftBudget = leftover;
    const out: Record<string, number> = {};
    for (const p of pots) {
      const share = perMonth > 0 ? r2((Number(p.monthly) || 0) / perMonth) : Number(p.monthly) || 0;
      const give = Math.min(share, leftBudget);
      if (give > 0.004) { out[p.id] = r2(give); leftBudget = r2(leftBudget - give); }
    }
    setPotDep(out);
  }

  function apply(withSavings: boolean) {
    const deposits = openGoals
      .map((g) => ({ id: g.id, name: g.name, v: withSavings ? r2(Number(dep[g.id]) || 0) : 0 }))
      .filter((d) => d.v > 0);
    const potDeposits = pots
      .map((p) => ({ id: p.id, name: p.name, v: withSavings ? r2(Number(potDep[p.id]) || 0) : 0 }))
      .filter((d) => d.v > 0);
    const goals = state.goals.map((g) => {
      const base = goalBaseline(g.id);
      const d = deposits.find((x) => x.id === g.id)?.v ?? 0;
      const next = r2(base + d);
      return next !== (Number(g.saved) || 0) ? { ...g, saved: next } : g;
    });
    const nextPots = state.pots.map((p) => {
      const base = potBaseline(p.id);
      const d = potDeposits.find((x) => x.id === p.id)?.v ?? 0;
      const next = r2(base + d);
      return next !== (Number(p.balance) || 0) ? { ...p, balance: next } : p;
    });
    const setAsideSum = r2(deposits.reduce((s, d) => s + d.v, 0) + potDeposits.reduce((s, d) => s + d.v, 0));
    const keepOnMain = covered ? essentials : total;
    const priv = covered ? r2(leftover - setAsideSum) : 0;

    const event: MoneyEvent = {
      id: uid('ev'), date: new Date(payDate + 'T12:00:00').toISOString(), kind: 'income', label,
      amount: Number(amount) || 0,
      lines: [
        { key: 'essentials', name: 'Kept for bills & debts', amount: keepOnMain },
        ...deposits.map((d) => ({ key: 'goal-' + d.id, name: d.name, amount: d.v })),
        ...potDeposits.map((d) => ({ key: 'pot-' + d.id, name: d.name, amount: d.v })),
        ...(priv > 0 ? [{ key: 'private', name: 'Private money', amount: priv }] : []),
      ],
    };
    update((s) => ({ ...s, goals, pots: nextPots, mainBalance: keepOnMain, events: [...s.events, event] }));
    setResult({
      keepOnMain, priv, covered,
      toSavings: [
        ...potDeposits.map((d) => ({ name: 'Into pot: ' + d.name, v: d.v, icon: 'shield' })),
        ...deposits.map((d) => ({ name: 'To goal: ' + d.name, v: d.v, icon: 'target' })),
      ],
    });
    setStep(4);
  }

  return (
    <Sheet open onClose={step === 4 ? onClose : () => { if (confirm('Stop without allocating?')) onClose(); }}
      title="💶 Add income"
      footer={step === 4 ? <Btn variant="primary" icon="check" onClick={onClose}>Done</Btn> : undefined}>

      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 0, lineHeight: 1.5 }}>
            {scheduled
              ? 'Got paid? Check your current balance and split this payday. 🎉'
              : 'New money in — let’s make sure the bills are covered first, then split the rest. 🎉'}
          </p>
          <Field label="Current balance of your main account" hint="As your bank shows it right now — this income is already in it.">
            <MoneyInput value={mainBal} onChange={setMainBal} />
          </Field>
          <Field label="How much came in this time?" hint={prefill.hint ?? 'Just for your history — the split uses your current balance above.'}>
            <MoneyInput value={amount} onChange={setAmount} />
          </Field>
          <Field label="Payslip date" hint={payDate !== todayISO() ? 'Bills due are counted from this date.' : "Defaults to today — change it if you're entering this a few days late."}>
            <DateInput value={payDate} onChange={(v) => setPayDate(v || todayISO())} style={{ maxWidth: 200 }} />
          </Field>
          <Field label="Label (optional)">
            <TextInput value={label} onChange={setLabel} placeholder="e.g. salary, invoice, gift" />
          </Field>
          <Btn variant="primary" style={{ justifyContent: 'center', padding: 13 }}
            disabled={total <= 0} onClick={() => setStep(1)}>
            Continue →
          </Btn>
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 12,
            background: covered ? 'color-mix(in oklch, var(--accent) 10%, transparent)' : 'color-mix(in oklch, var(--amber) 12%, transparent)',
            border: `1px solid ${covered ? 'color-mix(in oklch, var(--accent) 35%, transparent)' : 'color-mix(in oklch, var(--amber) 40%, transparent)'}`,
          }}>
            <Icon name={covered ? 'check' : 'flag'} size={19} stroke={covered ? 'var(--accent)' : 'var(--amber)'} />
            <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>
              {covered
                ? <>Your balance (<b className="num mono">{fmtEur(total)}</b>) covers <b>100%</b> of the bills and debt payments due this period (next {pe.days} days).</>
                : <>Your balance (<b className="num mono">{fmtEur(total)}</b>) is <b className="num mono">{fmtEur(essentials - total)}</b> short of this period's bills — everything stays on your main account this time.</>}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>1 · Cover this period's essentials first</div>
            <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 12 }}>
              {pe.rows.length === 0 && <div style={{ padding: '12px', fontSize: 13, color: 'var(--text-3)' }}>Nothing due in the next {pe.days} days.</div>}
              {pe.rows.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--line-2)', fontSize: 13 }}>
                  <Icon name={r.kind === 'debt' ? 'card' : 'cart'} size={15} stroke={r.kind === 'debt' ? 'var(--violet)' : 'var(--blue)'} />
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                  <span style={{ color: 'var(--text-3)', fontSize: 11, flex: '0 0 auto' }}>{r.inDays === 0 ? 'today' : r.inDays === 1 ? 'tomorrow' : `in ${r.inDays}d`} · {ordinal(r.payday)}</span>
                  <span className="num mono" style={{ flex: '0 0 auto' }}>{fmtEur(r.v)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-2)' }}>Bills due this period</span>
              <b className="num mono" style={{ color: 'var(--blue)' }}>{fmtEur(pe.expenses)}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-2)' }}>Debt payments due this period</span>
              <b className="num mono" style={{ color: 'var(--violet)' }}>{fmtEur(pe.debts)}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line)', fontSize: 14 }}>
              <b>Stays on your main account</b>
              <b className="num mono">{fmtEur(Math.min(total, essentials))}</b>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="dim" onClick={() => setStep(0)}>← Back</Btn>
            <Btn variant="primary" onClick={() => (covered ? setStep(2) : apply(false))}>
              {covered ? 'Continue →' : 'Keep it all for bills'}
            </Btn>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '10px 0 2px' }}>
            <div className="eyebrow">2 · What's left</div>
            <div className="num" style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--accent)', marginTop: 8 }}>
              {fmtEur(leftover)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>yours to allocate — this period's bills and debts are covered</div>
          </div>
          <p style={{ fontSize: 14.5, textAlign: 'center', margin: '4px 0' }}>
            Would you like to set some of this aside — into your pots or saving goals?
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" style={{ flex: 1, justifyContent: 'center', padding: 12 }} onClick={() => apply(false)}>
              No — keep it private
            </Btn>
            <Btn variant="primary" icon="shield" style={{ flex: 1, justifyContent: 'center', padding: 12 }}
              disabled={!canSetAside} onClick={() => { suggestPots(); setStep(3); }}>
              Yes, set aside
            </Btn>
          </div>
          {!canSetAside && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', margin: 0 }}>No pots or goals yet — add one on the Pots or Goals tab.</p>
          )}
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            padding: '10px 14px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.5,
            background: 'color-mix(in oklch, var(--amber) 10%, transparent)',
            border: '1px solid color-mix(in oklch, var(--amber) 30%, transparent)',
          }}>
            <b>Quick check:</b> is the current amount still accurate — or did you take money
            from a pot or goal for something else? Correct the <i>current</i> field first, then
            enter your deposit.
          </div>

          <div style={{
            position: 'sticky', top: 0, zIndex: 2, textAlign: 'center', padding: '9px 12px', borderRadius: 10,
            background: 'var(--bg-2)', fontSize: 13.5,
            border: `1px solid ${remaining < -0.005 ? 'var(--rose)' : 'var(--line)'}`,
            color: remaining < -0.005 ? 'var(--rose)' : 'var(--text)',
          }}>
            {remaining < -0.005
              ? <>Over by <b className="num mono">{fmtEur(-remaining)}</b> — you only have {fmtEur(leftover)} left</>
              : <>Left to allocate: <b className="num mono">{fmtEur(remaining)}</b> of {fmtEur(leftover)}</>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
            {pots.length > 0 && <div className="eyebrow" style={{ fontSize: 9.5 }}>Pots (buffers)</div>}
            {pots.map((p) => {
              const base = potBaseline(p.id);
              const cap = Number(p.target) || 0;
              return (
                <div key={p.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon name={p.icon || 'shield'} size={15} stroke="var(--violet)" />
                    <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span className="num mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{fmtEur(base)}{cap > 0 ? ' / ' + fmtEur(cap) : ''}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>Current (correct if needed)</div>
                      <MoneyInput value={potBase[p.id] ?? (Number(p.balance) || 0)}
                        onChange={(v) => setPotBase((s) => ({ ...s, [p.id]: v }))} />
                    </div>
                    <div>
                      <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>Deposit now</div>
                      <MoneyInput value={potDep[p.id] ?? ''}
                        onChange={(v) => setPotDep((s) => ({ ...s, [p.id]: v }))} />
                    </div>
                  </div>
                </div>
              );
            })}

            {openGoals.length > 0 && <div className="eyebrow" style={{ fontSize: 9.5, marginTop: pots.length > 0 ? 4 : 0 }}>Saving goals</div>}
            {openGoals.map((g) => {
              const base = goalBaseline(g.id);
              const target = Number(g.target) || 0;
              return (
                <div key={g.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon name="target" size={15} stroke={TEAL} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</span>
                    <span className="num mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{fmtEur(base)} / {fmtEur(target)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>Current (correct if needed)</div>
                      <MoneyInput value={baseline[g.id] ?? (Number(g.saved) || 0)}
                        onChange={(v) => setBaseline((s) => ({ ...s, [g.id]: v }))} />
                    </div>
                    <div>
                      <div className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>Deposit now</div>
                      <MoneyInput value={dep[g.id] ?? ''}
                        onChange={(v) => setDep((s) => ({ ...s, [g.id]: v }))} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="dim" onClick={() => setStep(2)}>← Back</Btn>
            <Btn variant="primary" icon="check" disabled={remaining < -0.005} onClick={() => apply(true)}>
              Allocate {depSum > 0 ? fmtEur(depSum) : ''}
            </Btn>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
            {result.covered ? '🎉 Allocated! Make these transfers:' : '📌 Bills first — everything stays put:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <TransferRow icon="wallet" label="Keep on main account (bills & debts)" v={result.keepOnMain} dashed />
            {result.toSavings.map((s) => <TransferRow key={s.name} icon={s.icon} label={s.name} v={s.v} />)}
            {result.priv > 0 && <TransferRow icon="user" label="Private money — pay yourself" v={result.priv} />}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0 }}>
            {result.covered
              ? 'Your pots, goals and balance are updated. 💪'
              : 'Not enough for all bills this time — nothing was moved to pots, savings or private money.'}
          </p>
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
