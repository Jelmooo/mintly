import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { AppState, Goal } from '../types';
import { type Budget, fmtEur, fmtMonth, monthsBetween, NOW } from '../engine';
import { Bar, Btn, Card, DateInput, Empty, Field, Icon, IconBtn, MoneyInput, PageHead, Pill, Ring, Segmented, Sheet, StatRow, TextInput } from '../ui';

type Upd = (u: Partial<AppState> | ((s: AppState) => AppState)) => void;
const TEAL = 'oklch(0.78 0.13 200)';

export function Goals({ state, b, update }: { state: AppState; b: Budget; update: Upd }) {
  const [edit, setEdit] = useState<Goal | null>(null);

  function save(item: Goal) {
    if (item.id) update((s) => ({ ...s, goals: s.goals.map((g) => (g.id === item.id ? item : g)) }));
    else update((s) => ({ ...s, goals: [...s.goals, { ...item, id: 'g' + Date.now(), priority: s.goals.length + 1 }] }));
    setEdit(null);
  }
  const reprioritize = (arr: Goal[]) => [...arr].sort((a, c) => a.priority - c.priority).map((g, i) => ({ ...g, priority: i + 1 }));
  const del = (id: string) => update((s) => ({ ...s, goals: reprioritize(s.goals.filter((g) => g.id !== id)) }));
  function move(id: string, dir: -1 | 1) {
    update((s) => {
      const sorted = [...s.goals].sort((a, c) => a.priority - c.priority);
      const i = sorted.findIndex((g) => g.id === id);
      const j = i + dir;
      if (j < 0 || j >= sorted.length) return s;
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      return { ...s, goals: sorted.map((g, k) => ({ ...g, priority: k + 1 })) };
    });
  }

  const goals = b.goals;
  const totalSaved = goals.reduce((s, g) => s + (Number(g.saved) || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (Number(g.target) || 0), 0);

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead title="Savings goals" sub="Dated goals are funded first by priority. Your top goal without a deadline catches everything left in your personal account."
        action={<Btn variant="primary" icon="plus" onClick={() => setEdit({ id: '', name: '', target: '', saved: 0, deadline: '', priority: 0 })}>Add</Btn>} />

      <StatRow items={[
        { label: 'Saved so far', value: fmtEur(totalSaved), color: TEAL },
        { label: 'Total targets', value: fmtEur(totalTarget), sub: Math.round(totalSaved / Math.max(1, totalTarget) * 100) + '% of all' },
        { label: 'Funding / month', value: fmtEur(b.savingsTotal), sub: b.goalsUnderfunded ? 'need ' + fmtEur(b.datedRequired) : 'on track', color: b.goalsUnderfunded ? 'var(--amber)' : 'var(--accent)' },
      ]} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {goals.length === 0 && <Card><Empty label="No goals yet — add your first." /></Card>}
        {goals.map((g, idx) => {
          const pct = Math.min(100, (Number(g.saved) / Number(g.target)) * 100 || 0);
          const open = !g.hasDeadline;
          const isTopOpen = open && b.topOpen && b.topOpen.id === g.id;
          const dl = open ? null : new Date(g.deadline);
          const monthsLeft = open ? null : Math.max(0, Math.ceil(monthsBetween(NOW, dl as Date)));
          const ringColor = open ? TEAL : (g.onTrack ? TEAL : 'var(--amber)');
          return (
            <Card key={g.id}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: '0 0 auto' }}>
                  <button onClick={() => move(g.id, -1)} disabled={idx === 0} style={arrowBtn(idx === 0)}><Icon name="arrow" size={14} style={{ transform: 'rotate(-90deg)' }} /></button>
                  <div className="mono" style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--bg-2)', border: '1px solid var(--line)', fontSize: 13, fontWeight: 600 }}>{g.priority}</div>
                  <button onClick={() => move(g.id, 1)} disabled={idx === goals.length - 1} style={arrowBtn(idx === goals.length - 1)}><Icon name="arrow" size={14} style={{ transform: 'rotate(90deg)' }} /></button>
                </div>
                <Ring pct={pct} size={66} thickness={8} color={ringColor}>
                  <div className="num mono" style={{ fontSize: 13, fontWeight: 600 }}>{Math.round(pct)}%</div>
                </Ring>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{g.name}</h3>
                    {open
                      ? (isTopOpen ? <Pill color={TEAL}><Icon name="arrow" size={11} /> catches the rest</Pill> : <Pill color="var(--text-2)">no deadline</Pill>)
                      : (g.onTrack ? <Pill color={TEAL}><Icon name="check" size={11} /> on track</Pill> : <Pill color="var(--amber)">underfunded</Pill>)}
                  </div>
                  <div className="num mono" style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>{fmtEur(Number(g.saved))} <span style={{ color: 'var(--text-3)' }}>/ {fmtEur(Number(g.target))}</span></div>
                  <div style={{ marginTop: 10 }}><Bar pct={pct} color={ringColor} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
                  <IconBtn name="card" onClick={() => setEdit(g)} title="Edit" />
                  <IconBtn name="trash" onClick={() => del(g.id)} title="Delete" danger />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 22, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-2)', flexWrap: 'wrap' }}>
                {open ? (
                  <>
                    <Metric label="Deadline" value="None" sub="ongoing" />
                    <Metric label="To go" value={fmtEur(g.remaining)} sub={'of ' + fmtEur(Number(g.target))} />
                    <Metric label="Funding now" value={fmtEur(g.funded) + '/mo'} color={isTopOpen ? TEAL : 'var(--text-3)'} sub={isTopOpen ? 'from leftover' : 'raise priority'} />
                  </>
                ) : (
                  <>
                    <Metric label="Deadline" value={fmtMonth(dl as Date)} sub={monthsLeft + ' mo left'} />
                    <Metric label="Need / mo" value={fmtEur(g.required)} sub={fmtEur(g.remaining) + ' to go'} />
                    <Metric label="Funding now" value={fmtEur(g.funded) + '/mo'} color={g.onTrack ? 'var(--accent)' : 'var(--amber)'} sub={g.shortfall > 0.5 ? '−' + fmtEur(g.shortfall) + ' short' : 'covered'} />
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <GoalSheet item={edit} onClose={() => setEdit(null)} onSave={save} />
    </div>
  );
}

function Metric({ label, value, sub, color }: { label: string; value: ReactNode; sub?: string; color?: string }) {
  return (
    <div>
      <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
      <div className="num mono" style={{ fontSize: 14.5, marginTop: 5, color: color || 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function arrowBtn(disabled: boolean): CSSProperties {
  return { width: 26, height: 22, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'transparent', border: '1px solid var(--line)', color: disabled ? 'var(--text-3)' : 'var(--text-2)', opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' };
}
function nextYear() { const d = new Date(NOW); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); }

function GoalSheet({ item, onClose, onSave }: { item: Goal | null; onClose: () => void; onSave: (g: Goal) => void }) {
  const [d, setD] = useState<Goal | null>(item);
  useEffect(() => setD(item), [item]);
  if (!d) return null;
  const set = (k: keyof Goal, v: unknown) => setD({ ...d, [k]: v } as Goal);
  return (
    <Sheet open={!!item} onClose={onClose} title={item && item.id ? 'Edit goal' : 'Add goal'}
      footer={<>
        <Btn variant="dim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" onClick={() => onSave(d)} disabled={!d.name || !d.target}>Save</Btn>
      </>}>
      <Field label="Goal name"><TextInput value={d.name} onChange={(v) => set('name', v)} placeholder="e.g. Emergency buffer" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Target amount"><MoneyInput value={d.target} onChange={(v) => set('target', v)} /></Field>
        <Field label="Saved already"><MoneyInput value={d.saved} onChange={(v) => set('saved', v)} /></Field>
      </div>
      <Field label="Deadline">
        <Segmented value={d.deadline ? 'yes' : 'no'}
          options={[{ value: 'no', label: 'No deadline' }, { value: 'yes', label: 'By a date' }]}
          onChange={(v) => set('deadline', v === 'yes' ? (d.deadline || nextYear()) : '')} />
      </Field>
      {d.deadline ? (
        <Field label="Target date" hint="We fund this first, dividing what's left by the months remaining.">
          <DateInput value={d.deadline} onChange={(v) => set('deadline', v)} />
        </Field>
      ) : (
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: -4, lineHeight: 1.5 }}>
          Open-ended. Your highest-priority goal without a deadline automatically catches everything left in your personal account each month.
        </div>
      )}
    </Sheet>
  );
}
