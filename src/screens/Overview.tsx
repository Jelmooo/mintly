import type { AppState } from '../types';
import { type Budget, CADENCE, fmtEur, ordinal } from '../engine';
import { Card, Icon, Pill, Ring, StatRow } from '../ui';

const TEAL = 'oklch(0.78 0.13 200)';

/** The four spec categories, monthly. */
function splitCats(b: Budget) {
  return [
    { key: 'exp', label: 'Money for expenses', icon: 'cart', v: b.expensesTotal, color: 'var(--blue)' },
    { key: 'debt', label: 'Money for debts', icon: 'card', v: b.debtTotal, color: 'var(--violet)' },
    { key: 'sav', label: 'Money for saving goals', icon: 'target', v: b.savingsTotal, color: TEAL },
    { key: 'priv', label: 'Private money', icon: 'user', v: Math.max(0, b.paidToPersonal - b.sweep), color: 'var(--accent)' },
  ];
}

function WaterfallBar({ b }: { b: Budget }) {
  const segs = splitCats(b).filter((s) => s.v > 0);
  const total = segs.reduce((s, x) => s + x.v, 0) || 1;
  return (
    <div>
      <div style={{ display: 'flex', height: 46, borderRadius: 12, overflow: 'hidden', gap: 2, background: 'var(--bg-2)' }}>
        {segs.map((s, i) => (
          <div key={s.key} title={`${s.label}: ${fmtEur(s.v)}`} style={{
            width: (s.v / total * 100) + '%', background: s.color, minWidth: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: `growW .6s ${i * 0.08}s cubic-bezier(.2,.8,.2,1)`, transformOrigin: 'left',
          }}>
            {s.v / total > 0.1 && <span className="num mono" style={{ fontSize: 12, fontWeight: 600, color: 'oklch(0.18 0.02 255)' }}>{fmtEur(s.v)}</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', marginTop: 14 }}>
        {segs.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{s.label}</span>
            <span className="num mono" style={{ fontSize: 12.5, color: 'var(--text)' }}>{fmtEur(s.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Path A: how each payday should be split, in per-payday amounts. */
function PaydaySplit({ b, state }: { b: Budget; state: AppState }) {
  const per = CADENCE[state.salary.cadence].perMonth || 1;
  const monthly = state.salary.cadence === 'monthly';
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 16 }}>Every payday, split it like this</h3>
        <Pill color="var(--text-2)">{CADENCE[state.salary.cadence].label}</Pill>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {splitCats(b).map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `color-mix(in oklch, ${s.color} 16%, transparent)`, color: s.color, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
              <Icon name={s.icon} size={17} />
            </div>
            <span style={{ flex: 1, fontSize: 14 }}>{s.label}</span>
            <div style={{ textAlign: 'right' }}>
              <div className="num mono" style={{ fontSize: 15, color: s.color }}>{fmtEur(s.v / per)}</div>
              {!monthly && <div className="num mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{fmtEur(s.v)}/mo</div>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SavingsPlanCard({ b, onNav }: { b: Budget; onNav: (id: string) => void }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16 }}>Savings plan</h3>
        <button onClick={() => onNav('goals')} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}>Manage <Icon name="arrow" size={13} /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {b.goals.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No goals yet.</div>}
        {b.goals.map((g) => {
          const pct = Math.min(100, (Number(g.saved) / Number(g.target)) * 100 || 0);
          const open = !g.hasDeadline;
          const isTopOpen = open && b.topOpen && b.topOpen.id === g.id;
          const col = open ? TEAL : (g.onTrack ? 'var(--accent)' : 'var(--amber)');
          return (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Ring pct={pct} size={52} thickness={6} color={col}>
                <span className="num mono" style={{ fontSize: 11, fontWeight: 600 }}>{Math.round(pct)}</span>
              </Ring>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</span>
                  <span className="num mono" style={{ fontSize: 13, color: col, flex: '0 0 auto' }}>{fmtEur(g.funded)}/mo</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                  {fmtEur(Number(g.saved))} of {fmtEur(Number(g.target))} · {open ? (isTopOpen ? 'catches the rest' : 'no deadline') : (g.onTrack ? 'on track' : 'needs ' + fmtEur(g.required) + '/mo')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LastEventCard({ state }: { state: AppState }) {
  const e = state.events[state.events.length - 1];
  if (!e) return null;
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="eyebrow">Last allocated</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            💶 {e.label}
            <span style={{ color: 'var(--text-3)' }}> · {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
        <div className="num mono" style={{ fontSize: 18, color: 'var(--accent)' }}>{fmtEur(e.amount)}</div>
      </div>
    </Card>
  );
}

/** Path B: manual / variable income — waiting for funding. */
function ManualOverview({ state, b, onNav, onMoneyIn }: OverviewProps) {
  const essentials = b.expensesTotal + b.debtTotal;
  const bal = state.mainBalance;
  const covered = bal >= essentials - 0.005;
  const essRows = [
    ...state.expenses.map((e) => ({ name: e.name, day: e.payday, v: Number(e.amount) || 0, icon: 'cart', color: 'var(--blue)' })),
    ...state.debts.filter((d) => Number(d.balance) > 0).map((d) => ({ name: d.name, day: d.payday ?? 1, v: Number(d.monthly) || 0, icon: 'card', color: 'var(--violet)' })),
  ].filter((r) => r.v > 0).sort((a, c) => (a.day ?? 1) - (c.day ?? 1));

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card style={{ position: 'relative', overflow: 'hidden', padding: '30px var(--pad)', textAlign: 'center' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent), transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />
        <div className="eyebrow">Manual income · waiting for funding</div>
        <div style={{ fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 600, letterSpacing: '-0.03em', marginTop: 10 }}>
          Money arrived?
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '10px auto 18px', maxWidth: 420, lineHeight: 1.5 }}>
          Add it and Mintly splits it for you — bills and debts first, then savings, and the rest is yours.
        </p>
        <button onClick={onMoneyIn} style={{
          display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 30px', borderRadius: 14,
          background: 'var(--accent)', color: '#06160c', border: 'none', fontWeight: 700, fontSize: 16,
        }}>
          <Icon name="plus" size={19} /> Add income
        </button>
      </Card>

      <StatRow items={[
        { label: 'Main account now', value: fmtEur(bal), color: covered ? 'var(--accent)' : 'var(--amber)' },
        { label: 'Upcoming bills + debts', value: fmtEur(essentials), sub: `${fmtEur(b.expensesTotal)} bills · ${fmtEur(b.debtTotal)} debt` },
        covered
          ? { label: 'Coverage', value: '✓ covered', color: 'var(--accent)', sub: fmtEur(bal - essentials) + ' above bills' }
          : { label: 'Coverage', value: fmtEur(essentials - bal), color: 'var(--amber)', sub: 'still needed for bills' },
      ]} />

      <div className="grid2 ov">
        <Card>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Upcoming essentials</h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {essRows.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No expenses or debts yet.</div>}
            {essRows.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '1px solid var(--line-2)', fontSize: 13.5 }}>
                <Icon name={r.icon} size={15} stroke={r.color} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{r.day ? ordinal(r.day) : ''}</span>
                <span className="num mono">{fmtEur(r.v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontSize: 14 }}>
              <b>Total per month</b><b className="num mono">{fmtEur(essentials)}</b>
            </div>
          </div>
        </Card>
        <SavingsPlanCard b={b} onNav={onNav} />
      </div>

      <LastEventCard state={state} />
    </div>
  );
}

interface OverviewProps {
  state: AppState; b: Budget; onNav: (id: string) => void; onMoneyIn: () => void;
}

export function Overview(props: OverviewProps) {
  const { state, b, onNav, onMoneyIn } = props;
  if (state.salary.cadence === 'manual') return <ManualOverview {...props} />;

  const dim = b.paidToPersonal < 0 || b.personalOver;
  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button onClick={onMoneyIn} style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '14px',
        borderRadius: 'var(--r)', background: 'var(--accent)', color: '#06160c', border: 'none', fontWeight: 700, fontSize: 15,
      }}>
        <Icon name="plus" size={18} /> Add income
      </button>

      {/* HERO */}
      <Card style={{ position: 'relative', overflow: 'hidden', padding: '28px var(--pad)' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent), transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow">{dim ? "You're over budget" : 'Paid to your personal account'}</div>
            <div className="num" style={{ fontSize: 'clamp(44px, 13vw, 68px)', fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 1, marginTop: 10, color: dim ? 'var(--rose)' : 'var(--accent)' }}>
              {fmtEur(b.paidToPersonal)}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 12, maxWidth: 460, lineHeight: 1.5 }}>
              {b.personalOver
                ? <>Your personal budgets total <b style={{ color: 'var(--text)' }}>{fmtEur(b.personalBudgetsTotal)}</b> — more than you pay yourself. Trim a budget to balance.</>
                : b.paidToPersonal < 0
                  ? <>Your fixed costs and dated goals leave nothing for your personal account. Ease up upstream to balance.</>
                  : b.topOpen
                    ? <><b style={{ color: 'var(--text)' }}>{fmtEur(b.personalBudgetsTotal)}</b> covers your spending budgets and <b style={{ color: 'var(--text)' }}>{fmtEur(b.sweep)}</b> sweeps into <b style={{ color: 'var(--text)' }}>{b.topOpen.name}</b> each month.</>
                    : <><b style={{ color: 'var(--text)' }}>{fmtEur(b.personalBudgetsTotal)}</b> covers your budgets, leaving <b style={{ color: 'var(--text)' }}>{fmtEur(Math.max(0, b.personalFree))}</b> free. Add a goal with no deadline to auto-save it.</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Monthly income</div>
            <div className="num" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 6 }}>{fmtEur(b.incomeTotal)}</div>
            <Pill color="var(--text-2)" style={{ marginTop: 10 }}>{CADENCE[state.salary.cadence].label} salary</Pill>
          </div>
        </div>
        <div style={{ marginTop: 24 }}><WaterfallBar b={b} /></div>
      </Card>

      {(b.overAllocated || b.goalsUnderfunded || b.personalOver) && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px', background: 'color-mix(in oklch, var(--amber) 12%, var(--surface))', border: '1px solid color-mix(in oklch, var(--amber) 35%, transparent)', borderRadius: 'var(--r)' }}>
          <div style={{ color: 'var(--amber)', flex: '0 0 auto' }}><Icon name="flag" size={20} /></div>
          <div style={{ fontSize: 13, color: 'var(--text)' }}>
            {b.overAllocated
              ? 'Your fixed expenses and debt payments are higher than your income. There\'s nothing left to allocate.'
              : b.personalOver
                ? 'Your personal budgets are bigger than what you pay yourself — nothing sweeps into savings.'
                : 'Your dated goals need more than what\'s left after expenses and debt. Lower-priority dated goals are underfunded — adjust deadlines or amounts.'}
          </div>
        </div>
      )}

      <div className="grid2 ov">
        <PaydaySplit b={b} state={state} />
        <SavingsPlanCard b={b} onNav={onNav} />
      </div>

      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 18 }}>Where your money goes</h3>
        <SpendBreakdown b={b} />
      </Card>

      <LastEventCard state={state} />
    </div>
  );
}

function SpendBreakdown({ b }: { b: Budget }) {
  const cats = b.cats;
  const catRows = Object.entries(b.expByCat).map(([k, v]) => ({ k, v, ...(cats[k] || cats.other) })).sort((a, c) => c.v - a.v);
  const rows = [
    ...catRows.map((c) => ({ label: c.label, v: c.v, color: c.color })),
    { label: 'Debt', v: b.debtTotal, color: 'var(--violet)' },
    { label: 'Savings', v: b.savingsTotal, color: TEAL },
    { label: 'Personal budget', v: b.personalBudgetsTotal, color: 'var(--accent)' },
  ].filter((r) => r.v > 0);
  const total = rows.reduce((s, r) => s + r.v, 0) || 1;
  let acc = 0;
  const stops = rows.map((r) => { const a = acc; acc += r.v / total * 360; return `${r.color} ${a}deg ${acc}deg`; });
  const conic = `conic-gradient(${stops.join(',')})`;
  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 150, height: 150, flex: '0 0 auto', margin: '0 auto' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: conic, mask: 'radial-gradient(farthest-side, transparent 56%, #000 56%)', WebkitMask: 'radial-gradient(farthest-side, transparent 56%, #000 56%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div className="eyebrow" style={{ fontSize: 9 }}>per month</div>
            <div className="num" style={{ fontSize: 19, fontWeight: 600 }}>{fmtEur(total)}</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 220, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 22px' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: r.color, flex: '0 0 auto' }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
            <span className="num mono" style={{ fontSize: 13 }}>{fmtEur(r.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
