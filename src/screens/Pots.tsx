import { useEffect, useState } from 'react';
import type { AppState, Pot } from '../types';
import { type Budget, CADENCE, fmtEur, uid } from '../engine';
import { Bar, Btn, Card, Empty, Field, Icon, IconBtn, MoneyInput, PageHead, Pill, Sheet, StatRow, TextInput } from '../ui';

type Upd = (u: Partial<AppState> | ((s: AppState) => AppState)) => void;
const n = (v: unknown) => Number(v) || 0;
const r2 = (v: number) => Math.round(v * 100) / 100;
const VIOLET = 'var(--violet)';

const POT_ICONS = ['shield', 'bus', 'home', 'bolt', 'heart', 'card', 'coins', 'cup', 'bag', 'cart', 'dot'];

export function Pots({ state, b, update }: { state: AppState; b: Budget; update: Upd }) {
  const [edit, setEdit] = useState<Pot | null>(null);
  const [move, setMove] = useState<{ pot: Pot; mode: 'deposit' | 'withdraw' } | null>(null);
  const pots = state.pots || [];
  const per = CADENCE[state.salary.cadence].perMonth;

  function save(item: Pot) {
    if (item.id) update((s) => ({ ...s, pots: s.pots.map((p) => (p.id === item.id ? item : p)) }));
    else update((s) => ({ ...s, pots: [...(s.pots || []), { ...item, id: uid('pot') }] }));
    setEdit(null);
  }
  const del = (id: string) => update((s) => ({ ...s, pots: s.pots.filter((p) => p.id !== id) }));
  function applyMove(amount: number) {
    if (!move) return;
    const delta = move.mode === 'deposit' ? amount : -amount;
    update((s) => ({ ...s, pots: s.pots.map((p) => (p.id === move.pot.id ? { ...p, balance: r2(Math.max(0, n(p.balance) + delta)) } : p)) }));
    setMove(null);
  }

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead title="Pots" sub="Buffers for irregular costs — car repair, a broken appliance, the dentist. Top them up, draw from them when something breaks."
        action={<Btn variant="primary" icon="plus" onClick={() => setEdit({ id: '', name: '', balance: '', monthly: '', target: '', icon: 'shield' })}>Add</Btn>} />

      <StatRow items={[
        { label: 'In your pots', value: fmtEur(b.potsTotal), color: VIOLET },
        { label: 'Set aside / month', value: fmtEur(b.potsMonthly) },
        { label: 'Pots', value: pots.length },
      ]} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {pots.length === 0 && (
          <Card><Empty label="No pots yet. Add one for unexpected costs like car repairs or a new washing machine." /></Card>
        )}
        {pots.map((p) => {
          const bal = n(p.balance);
          const target = n(p.target);
          const pct = target > 0 ? Math.min(100, (bal / target) * 100) : 0;
          const share = per > 0 ? r2(n(p.monthly) / per) : n(p.monthly);
          return (
            <Card key={p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `color-mix(in oklch, ${VIOLET} 16%, transparent)`, color: VIOLET, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name={p.icon || 'shield'} size={21} /></div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h3>
                    <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                      {n(p.monthly) > 0 && <Pill color="var(--text-2)">{fmtEur(n(p.monthly))}/mo{per > 0 && per !== 1 ? ` · ${fmtEur(share)}/${CADENCE[state.salary.cadence].short}` : ''}</Pill>}
                      {target > 0 && <Pill color="var(--text-2)">cap {fmtEur(target)}</Pill>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
                  <IconBtn name="card" onClick={() => setEdit(p)} title="Edit" />
                  <IconBtn name="trash" onClick={() => del(p.id)} title="Delete" danger />
                </div>
              </div>

              <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: VIOLET }}>{fmtEur(bal)}</div>
              {target > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Bar pct={pct} color={VIOLET} />
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 5 }} className="num mono">{fmtEur(bal)} of {fmtEur(target)} ({Math.round(pct)}%)</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Btn variant="ghost" icon="plus" size="sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMove({ pot: p, mode: 'deposit' })}>Deposit</Btn>
                <Btn variant="dim" icon="arrow" size="sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMove({ pot: p, mode: 'withdraw' })} >Withdraw</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      <PotSheet item={edit} onClose={() => setEdit(null)} onSave={save} />
      <PotMoveSheet move={move} onClose={() => setMove(null)} onApply={applyMove} />
    </div>
  );
}

function PotSheet({ item, onClose, onSave }: { item: Pot | null; onClose: () => void; onSave: (p: Pot) => void }) {
  const [d, setD] = useState<Pot | null>(item);
  useEffect(() => setD(item), [item]);
  if (!d) return null;
  const set = (k: keyof Pot, v: unknown) => setD({ ...d, [k]: v } as Pot);
  return (
    <Sheet open={!!item} onClose={onClose} title={item && item.id ? 'Edit pot' : 'Add pot'}
      footer={<>
        <Btn variant="dim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" onClick={() => onSave(d)} disabled={!d.name}>Save</Btn>
      </>}>
      <Field label="Name"><TextInput value={d.name} onChange={(v) => set('name', v)} placeholder="e.g. Car & repairs, Emergency, Appliances" /></Field>
      <Field label="Icon">
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {POT_ICONS.map((ic) => {
            const on = (d.icon || 'shield') === ic;
            return (
              <button key={ic} onClick={() => set('icon', ic)} style={{
                width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', cursor: 'pointer',
                background: on ? `color-mix(in oklch, ${VIOLET} 18%, transparent)` : 'var(--bg-2)',
                border: `1px solid ${on ? VIOLET : 'var(--line)'}`, color: on ? VIOLET : 'var(--text-2)',
              }}><Icon name={ic} size={18} /></button>
            );
          })}
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Current balance"><MoneyInput value={d.balance} onChange={(v) => set('balance', v)} /></Field>
        <Field label="Set aside / month" hint="Suggested each payday"><MoneyInput value={d.monthly} onChange={(v) => set('monthly', v)} /></Field>
      </div>
      <Field label="Target cap" hint="Optional — how much you aim to keep in this pot"><MoneyInput value={d.target ?? ''} onChange={(v) => set('target', v)} /></Field>
    </Sheet>
  );
}

function PotMoveSheet({ move, onClose, onApply }: { move: { pot: Pot; mode: 'deposit' | 'withdraw' } | null; onClose: () => void; onApply: (amount: number) => void }) {
  const [amount, setAmount] = useState<number | ''>('');
  useEffect(() => { setAmount(''); }, [move]);
  if (!move) return null;
  const deposit = move.mode === 'deposit';
  const bal = n(move.pot.balance);
  const amt = n(amount);
  const after = deposit ? r2(bal + amt) : r2(Math.max(0, bal - amt));
  const tooMuch = !deposit && amt > bal + 0.005;
  return (
    <Sheet open onClose={onClose} title={`${deposit ? 'Deposit into' : 'Withdraw from'} ${move.pot.name}`}
      footer={<>
        <Btn variant="dim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" disabled={amt <= 0 || tooMuch} onClick={() => onApply(amt)}>{deposit ? 'Deposit' : 'Withdraw'}</Btn>
      </>}>
      <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 0 }}>
        {deposit
          ? 'Move money into this pot to build up the buffer.'
          : 'Something came up? Take money out — e.g. to pay for the repair.'}
      </p>
      <Field label={deposit ? 'Amount to deposit' : 'Amount to withdraw'}><MoneyInput value={amount} onChange={setAmount} /></Field>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{tooMuch ? "That's more than the pot holds" : 'Balance after'}</span>
        <span className="num mono" style={{ fontSize: 16, fontWeight: 600, color: tooMuch ? 'var(--rose)' : VIOLET }}>{fmtEur(after)}</span>
      </div>
    </Sheet>
  );
}
