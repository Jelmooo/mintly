import { useEffect, useState } from 'react';
import type { AppState, PersonalBudget } from '../types';
import { type Budget, fmtEur, PCATS } from '../engine';
import { Btn, Card, CatDot, Empty, Field, Icon, IconBtn, MoneyInput, PageHead, Pill, Sheet, StatRow, TextInput } from '../ui';

type Upd = (u: Partial<AppState> | ((s: AppState) => AppState)) => void;
const TEAL = 'oklch(0.78 0.13 200)';

export function Personal({ state, b, update, onNav }: { state: AppState; b: Budget; update: Upd; onNav: (id: string) => void }) {
  const [edit, setEdit] = useState<PersonalBudget | null>(null);

  function save(item: PersonalBudget) {
    if (item.id) update((s) => ({ ...s, personalBudgets: s.personalBudgets.map((p) => (p.id === item.id ? item : p)) }));
    else update((s) => ({ ...s, personalBudgets: [...s.personalBudgets, { ...item, id: 'p' + Date.now() }] }));
    setEdit(null);
  }
  const del = (id: string) => update((s) => ({ ...s, personalBudgets: s.personalBudgets.filter((p) => p.id !== id) }));

  const top = b.topOpen;
  const budgets = b.personalBudgets;

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead title="Personal account" sub="Budget the money you pay yourself. Whatever's left sweeps into your top open goal."
        action={<Btn variant="primary" icon="plus" onClick={() => setEdit({ id: '', name: '', category: 'groceries', amount: '' })}>Add</Btn>} />

      <StatRow items={[
        { label: 'Paid to you', value: fmtEur(b.paidToPersonal), color: 'var(--accent)' },
        { label: 'Budgeted', value: fmtEur(b.personalBudgetsTotal) },
        { label: top ? 'Swept to savings' : 'Unbudgeted', value: fmtEur(top ? b.sweep : Math.max(0, b.personalFree)), color: b.personalOver ? 'var(--rose)' : TEAL },
      ]} />

      {b.personalOver && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px', background: 'color-mix(in oklch, var(--rose) 12%, var(--surface))', border: '1px solid color-mix(in oklch, var(--rose) 35%, transparent)', borderRadius: 'var(--r)' }}>
          <div style={{ color: 'var(--rose)', flex: '0 0 auto' }}><Icon name="flag" size={20} /></div>
          <div style={{ fontSize: 13, color: 'var(--text)' }}>Your personal budgets total <b>{fmtEur(b.personalBudgetsTotal)}</b>, which is <b>{fmtEur(-b.personalFree)}</b> more than the <b>{fmtEur(b.paidToPersonal)}</b> you pay yourself. Trim a budget or free up money upstream.</div>
        </div>
      )}

      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Spending budgets</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line-2)', borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--line)' }}>
          {budgets.length === 0 && <Empty label="No budgets yet — add groceries, going out, etc." />}
          {budgets.map((p) => {
            const cat = PCATS[p.category] || PCATS.other;
            const share = b.paidToPersonal > 0 ? (Number(p.amount) / b.paidToPersonal) * 100 : 0;
            return (
              <div key={p.id} style={{ background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
                <CatDot category={p.category} cats={PCATS} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || cat.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{cat.label} · {Math.round(share)}% of your pay</div>
                </div>
                <div className="num mono" style={{ fontSize: 15, textAlign: 'right', flex: '0 0 auto' }}>{fmtEur(Number(p.amount) || 0)}</div>
                <div style={{ display: 'flex', gap: 4, flex: '0 0 auto' }}>
                  <IconBtn name="card" onClick={() => setEdit(p)} title="Edit" />
                  <IconBtn name="trash" onClick={() => del(p.id)} title="Delete" danger />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <span style={{ color: 'var(--text-2)', fontSize: 14 }}>Total budgeted</span>
          <span className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>{fmtEur(b.personalBudgetsTotal)}</span>
        </div>
      </Card>

      <Card style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="eyebrow">The rest goes to</div>
        {top ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `color-mix(in oklch, ${TEAL} 18%, transparent)`, color: TEAL, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name="target" size={21} /></div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{top.name}</div>
                <Pill color="var(--text-2)" style={{ marginTop: 4 }}>no deadline · ongoing</Pill>
              </div>
            </div>
            <div className="num" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', color: TEAL, marginTop: 16 }}>{fmtEur(b.sweep)}<span style={{ fontSize: 15, color: 'var(--text-3)' }}> /mo</span></div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 6 }}>Everything left in your personal account after budgets is saved here automatically.</div>
            <button onClick={() => onNav('goals')} style={linkBtn}>Manage goals <Icon name="arrow" size={14} /></button>
          </>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>You have no open-ended goal, so <b style={{ color: 'var(--text)' }}>{fmtEur(Math.max(0, b.personalFree))}</b> stays free each month. Add a goal without a deadline to sweep the leftover into savings.</div>
            <button onClick={() => onNav('goals')} style={linkBtn}>Add a goal <Icon name="arrow" size={14} /></button>
          </div>
        )}
      </Card>

      <Card>
        <div className="eyebrow" style={{ marginBottom: 14 }}>How your pay splits</div>
        <SplitBar budget={b.personalBudgetsTotal} sweep={top ? b.sweep : 0} free={top ? 0 : Math.max(0, b.personalFree)} />
      </Card>

      <BudgetSheet item={edit} onClose={() => setEdit(null)} onSave={save} />
    </div>
  );
}

const linkBtn: React.CSSProperties = { marginTop: 14, background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text)', borderRadius: 10, padding: '9px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 };

function SplitBar({ budget, sweep, free }: { budget: number; sweep: number; free: number }) {
  const total = Math.max(budget + sweep + free, 1);
  const segs = [
    { label: 'Budgets', v: budget, color: 'var(--accent)' },
    { label: 'Saved', v: sweep, color: TEAL },
    { label: 'Free', v: free, color: 'var(--text-3)' },
  ].filter((s) => s.v > 0);
  return (
    <div>
      <div style={{ display: 'flex', height: 38, borderRadius: 11, overflow: 'hidden', gap: 2, background: 'var(--bg-2)' }}>
        {segs.map((s, i) => (
          <div key={i} title={`${s.label}: ${fmtEur(s.v)}`} style={{ width: (s.v / total * 100) + '%', background: s.color, minWidth: 3, animation: `growW .6s ${i * 0.08}s cubic-bezier(.2,.8,.2,1)`, transformOrigin: 'left' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{s.label}</span>
            <span className="num mono" style={{ fontSize: 13 }}>{fmtEur(s.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetSheet({ item, onClose, onSave }: { item: PersonalBudget | null; onClose: () => void; onSave: (p: PersonalBudget) => void }) {
  const [d, setD] = useState<PersonalBudget | null>(item);
  useEffect(() => setD(item), [item]);
  if (!d) return null;
  const set = (k: keyof PersonalBudget, v: unknown) => setD({ ...d, [k]: v } as PersonalBudget);
  return (
    <Sheet open={!!item} onClose={onClose} title={item && item.id ? 'Edit budget' : 'Add budget'}
      footer={<>
        <Btn variant="dim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" onClick={() => onSave(d)} disabled={!d.name || !d.amount}>Save</Btn>
      </>}>
      <Field label="Name"><TextInput value={d.name} onChange={(v) => set('name', v)} placeholder="e.g. Going out" /></Field>
      <Field label="Category">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {Object.entries(PCATS).map(([k, c]) => {
            const on = d.category === k;
            return (
              <button key={k} onClick={() => set('category', k)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '11px 4px',
                borderRadius: 12, cursor: 'pointer', background: on ? `color-mix(in oklch, ${c.color} 16%, transparent)` : 'var(--bg-2)',
                border: `1px solid ${on ? c.color : 'var(--line)'}`, color: on ? c.color : 'var(--text-2)',
              }}>
                <Icon name={c.icon} size={18} />
                <span style={{ fontSize: 10.5, fontWeight: 500, lineHeight: 1.1, textAlign: 'center' }}>{c.label.split(' & ')[0]}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Monthly budget"><MoneyInput value={d.amount} onChange={(v) => set('amount', v)} /></Field>
    </Sheet>
  );
}
