import type { AppState } from '../types';
import { type BillReserve, billReserve, type Budget, CADENCE, fmtEur, ordinal, periodIncome } from '../engine';
import { Bar, Card, Icon, Pill, Ring, StatRow } from '../ui';

const TEAL = 'oklch(0.78 0.13 200)';
const r2 = (v: number) => Math.round(v * 100) / 100;

interface OverviewProps {
  state: AppState; b: Budget; onNav: (id: string) => void; onMoneyIn: () => void;
}

function dueLabel(inDays: number, payday: number) {
  const when = inDays === 0 ? 'today' : inDays === 1 ? 'tomorrow' : `in ${inDays} days`;
  return `${when} · the ${ordinal(payday)}`;
}

function PeriodBar({ expenses, debts, goalsShare, leftover }: { expenses: number; debts: number; goalsShare: number; leftover: number }) {
  const segs = [
    { key: 'exp', label: 'For bills', v: expenses, color: 'var(--blue)' },
    { key: 'debt', label: 'For debt', v: debts, color: 'var(--violet)' },
    { key: 'sav', label: 'Toward goals', v: goalsShare, color: TEAL },
    { key: 'left', label: 'Left over', v: Math.max(0, leftover), color: 'var(--accent)' },
  ].filter((s) => s.v > 0);
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
            {s.v / total > 0.14 && <span className="num mono" style={{ fontSize: 12, fontWeight: 600, color: 'oklch(0.18 0.02 255)' }}>{fmtEur(s.v)}</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 12 }}>
        {segs.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{s.label}</span>
            <span className="num mono" style={{ fontSize: 12.5 }}>{fmtEur(s.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillReserveCard({ br }: { br: BillReserve }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
        <h3 style={{ fontSize: 16 }}>Set aside for bills</h3>
        <Pill color="var(--text-2)">smoothed</Pill>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>Each bill's share built up so far, toward its due date — never a lump.</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {br.rows.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No bills or debts yet.</div>}
        {br.rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '1px solid var(--line-2)', fontSize: 13.5 }}>
            <Icon name={r.kind === 'debt' ? 'card' : 'cart'} size={15} stroke={r.kind === 'debt' ? 'var(--violet)' : 'var(--blue)'} />
            <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
            <span style={{ color: 'var(--text-3)', fontSize: 11, flex: '0 0 auto' }}>{dueLabel(r.inDays, r.payday)}</span>
            <span className="num mono" style={{ flex: '0 0 auto' }} title={`${fmtEur(r.accrued)} of ${fmtEur(r.amount)}`}>{fmtEur(r.accrued)}</span>
          </div>
        ))}
        {br.rows.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontSize: 14 }}>
            <b>Keep aside now</b><b className="num mono">{fmtEur(br.total)}</b>
          </div>
        )}
      </div>
    </Card>
  );
}

function MonthlyPlanCard({ b }: { b: Budget }) {
  const rows = [
    { label: 'Money for expenses', icon: 'cart', v: b.expensesTotal, color: 'var(--blue)' },
    { label: 'Money for debts', icon: 'card', v: b.debtTotal, color: 'var(--violet)' },
    { label: 'Money for saving goals', icon: 'target', v: b.savingsTotal, color: TEAL },
    { label: 'Left over to allocate', icon: 'coins', v: b.leftover, color: b.leftover < 0 ? 'var(--rose)' : 'var(--accent)' },
  ];
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8 }}>
        <h3 style={{ fontSize: 16 }}>Monthly plan</h3>
        <Pill color="var(--text-2)">whole month</Pill>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `color-mix(in oklch, ${s.color} 16%, transparent)`, color: s.color, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
              <Icon name={s.icon} size={17} />
            </div>
            <span style={{ flex: 1, fontSize: 14 }}>{s.label}</span>
            <span className="num mono" style={{ fontSize: 15, color: s.color }}>{fmtEur(s.v)}</span>
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
          const col = open ? TEAL : (g.onTrack ? 'var(--accent)' : 'var(--amber)');
          return (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Ring pct={pct} size={52} thickness={6} color={col}>
                <span className="num mono" style={{ fontSize: 11, fontWeight: 600 }}>{Math.round(pct)}</span>
              </Ring>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</span>
                  {!open && <span className="num mono" style={{ fontSize: 13, color: col, flex: '0 0 auto' }}>{fmtEur(g.funded)}/mo</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                  {fmtEur(Number(g.saved))} of {fmtEur(Number(g.target))} · {open ? 'fund from leftover' : (g.onTrack ? 'on track' : 'needs ' + fmtEur(g.required) + '/mo')}
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

function PotsCard({ state, onNav }: { state: AppState; onNav: (id: string) => void }) {
  const pots = state.pots || [];
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16 }}>Pots</h3>
        <button onClick={() => onNav('pots')} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}>Manage <Icon name="arrow" size={13} /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pots.map((p) => {
          const bal = Number(p.balance) || 0;
          const target = Number(p.target) || 0;
          const pct = target > 0 ? Math.min(100, (bal / target) * 100) : 0;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'color-mix(in oklch, var(--violet) 16%, transparent)', color: 'var(--violet)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon name={p.icon || 'shield'} size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  <span className="num mono" style={{ fontSize: 13.5, color: 'var(--violet)', flex: '0 0 auto' }}>{fmtEur(bal)}</span>
                </div>
                {target > 0
                  ? <div style={{ marginTop: 5 }}><Bar pct={pct} color="var(--violet)" h={6} /></div>
                  : Number(p.monthly) > 0 && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{fmtEur(Number(p.monthly))}/mo set aside</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AddIncomeButton({ onMoneyIn, big }: { onMoneyIn: () => void; big?: boolean }) {
  return (
    <button onClick={onMoneyIn} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
      padding: big ? '15px 30px' : '14px', borderRadius: big ? 14 : 'var(--r)',
      background: 'var(--accent)', color: '#06160c', border: 'none', fontWeight: 700,
      fontSize: big ? 16 : 15, width: big ? undefined : '100%',
    }}>
      <Icon name="plus" size={big ? 19 : 18} /> Add income
    </button>
  );
}

/** Path B: manual / variable income — waiting for funding. */
function ManualOverview({ state, b, onNav, onMoneyIn }: OverviewProps) {
  const br = billReserve(state);
  const bal = state.mainBalance;
  const covered = bal >= br.total - 0.005;
  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card style={{ position: 'relative', overflow: 'hidden', padding: '30px var(--pad)', textAlign: 'center' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent), transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />
        <div className="eyebrow">Manual income · waiting for funding</div>
        <div style={{ fontSize: 'clamp(26px, 6vw, 34px)', fontWeight: 600, letterSpacing: '-0.03em', marginTop: 10 }}>
          Money arrived?
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '10px auto 18px', maxWidth: 420, lineHeight: 1.5 }}>
          Add it and Mintly splits it for you — topping up the reserve for upcoming bills first, then whatever you choose.
        </p>
        <AddIncomeButton onMoneyIn={onMoneyIn} big />
      </Card>

      <StatRow items={[
        { label: 'Main account now', value: fmtEur(bal), color: covered ? 'var(--accent)' : 'var(--amber)' },
        { label: 'Bill reserve needed', value: fmtEur(br.total), sub: `${fmtEur(br.expenses)} bills · ${fmtEur(br.debts)} debt` },
        covered
          ? { label: 'Coverage', value: '✓ covered', color: 'var(--accent)', sub: fmtEur(r2(bal - br.total)) + ' above reserve' }
          : { label: 'Coverage', value: fmtEur(r2(br.total - bal)), color: 'var(--amber)', sub: 'still needed for bills' },
      ]} />

      <div className="grid2 ov">
        <BillReserveCard br={br} />
        <SavingsPlanCard b={b} onNav={onNav} />
      </div>

      {(state.pots || []).length > 0 && (
        <div className="grid2 ov">
          <PotsCard state={state} onNav={onNav} />
        </div>
      )}

      <LastEventCard state={state} />
    </div>
  );
}

export function Overview(props: OverviewProps) {
  const { state, b, onNav, onMoneyIn } = props;
  if (state.salary.cadence === 'manual') return <ManualOverview {...props} />;

  const per = CADENCE[state.salary.cadence].perMonth;
  const br = billReserve(state);
  const perIncome = r2(periodIncome(state));
  const billsPerPeriod = r2((b.expensesTotal + b.debtTotal) / per);
  const expPerPeriod = r2(b.expensesTotal / per);
  const debtPerPeriod = r2(b.debtTotal / per);
  const goalsShare = r2(b.datedFunded / per);
  const leftoverPeriod = r2(perIncome - billsPerPeriod - goalsShare);
  const heavy = leftoverPeriod < 0;

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <AddIncomeButton onMoneyIn={onMoneyIn} />

      {/* HERO — this period, not grand totals */}
      <Card style={{ position: 'relative', overflow: 'hidden', padding: '28px var(--pad)' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent), transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow">{heavy ? 'Heavy period' : 'Left over this period'}</div>
            <div className="num" style={{ fontSize: 'clamp(40px, 12vw, 64px)', fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 1, marginTop: 10, color: heavy ? 'var(--rose)' : 'var(--accent)' }}>
              {fmtEur(leftoverPeriod)}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 12, maxWidth: 460, lineHeight: 1.5 }}>
              {heavy
                ? <>Your bills average <b style={{ color: 'var(--text)' }}>{fmtEur(billsPerPeriod)}</b> per {CADENCE[state.salary.cadence].short}, more than one pay of {fmtEur(perIncome)} — cover the gap from your buffer.</>
                : <><b style={{ color: 'var(--text)' }}>{fmtEur(perIncome)}</b> comes in, <b style={{ color: 'var(--text)' }}>{fmtEur(billsPerPeriod)}</b> is set aside for bills{goalsShare > 0 && <> and <b style={{ color: 'var(--text)' }}>{fmtEur(goalsShare)}</b> toward dated goals</>} — spread evenly, not lumped. Allocate the rest when it lands.</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Income per {CADENCE[state.salary.cadence].short}</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 6 }}>{fmtEur(perIncome)}</div>
            <Pill color="var(--text-2)" style={{ marginTop: 10 }}>{CADENCE[state.salary.cadence].label} salary</Pill>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <PeriodBar expenses={expPerPeriod} debts={debtPerPeriod} goalsShare={goalsShare} leftover={leftoverPeriod} />
        </div>
      </Card>

      {(b.overAllocated || b.goalsUnderfunded) && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px', background: 'color-mix(in oklch, var(--amber) 12%, var(--surface))', border: '1px solid color-mix(in oklch, var(--amber) 35%, transparent)', borderRadius: 'var(--r)' }}>
          <div style={{ color: 'var(--amber)', flex: '0 0 auto' }}><Icon name="flag" size={20} /></div>
          <div style={{ fontSize: 13, color: 'var(--text)' }}>
            {b.overAllocated
              ? 'Your fixed expenses and debt payments are higher than your income. There\'s nothing left to allocate.'
              : 'Your dated goals need more than what\'s left after expenses and debt — adjust deadlines or amounts.'}
          </div>
        </div>
      )}

      <div className="grid2 ov">
        <BillReserveCard br={br} />
        <MonthlyPlanCard b={b} />
      </div>

      <div className="grid2 ov">
        <SavingsPlanCard b={b} onNav={onNav} />
        {(state.pots || []).length > 0
          ? <PotsCard state={state} onNav={onNav} />
          : <SpendBreakdownCard b={b} />}
      </div>

      {(state.pots || []).length > 0 && <SpendBreakdownCard b={b} />}

      <LastEventCard state={state} />
    </div>
  );
}

function SpendBreakdownCard({ b }: { b: Budget }) {
  const cats = b.cats;
  const catRows = Object.entries(b.expByCat).map(([k, v]) => ({ k, v, ...(cats[k] || cats.other) })).sort((a, c) => c.v - a.v);
  const rows = [
    ...catRows.map((c) => ({ label: c.label, v: c.v, color: c.color })),
    { label: 'Debt', v: b.debtTotal, color: 'var(--violet)' },
    { label: 'Saving goals', v: b.savingsTotal, color: TEAL },
    { label: 'Left over', v: Math.max(0, b.leftover), color: 'var(--accent)' },
  ].filter((r) => r.v > 0);
  const total = rows.reduce((s, r) => s + r.v, 0) || 1;
  let acc = 0;
  const stops = rows.map((r) => { const a = acc; acc += r.v / total * 360; return `${r.color} ${a}deg ${acc}deg`; });
  const conic = `conic-gradient(${stops.join(',')})`;
  return (
    <Card>
      <h3 style={{ fontSize: 16, marginBottom: 18 }}>Where your money goes</h3>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 140, height: 140, flex: '0 0 auto', margin: '0 auto' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: conic, mask: 'radial-gradient(farthest-side, transparent 56%, #000 56%)', WebkitMask: 'radial-gradient(farthest-side, transparent 56%, #000 56%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div>
              <div className="eyebrow" style={{ fontSize: 9 }}>per month</div>
              <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{fmtEur(total)}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200, display: 'grid', gridTemplateColumns: '1fr', gap: '8px 18px' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: r.color, flex: '0 0 auto' }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
              <span className="num mono" style={{ fontSize: 13 }}>{fmtEur(r.v)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
