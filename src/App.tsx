import { useEffect, useMemo, useRef, useState } from 'react';
import { StoreProvider, onboarding, useStore } from './store';
import { computeBudget, CADENCE } from './engine';
import { Icon, Pill } from './ui';
import { Overview } from './screens/Overview';
import { Income } from './screens/Income';
import { Expenses } from './screens/Expenses';
import { Debt } from './screens/Debt';
import { Goals } from './screens/Goals';
import { Personal } from './screens/Personal';
import { Onboarding } from './screens/Onboarding';
import { MoneyIn } from './screens/MoneyIn';
import iconUrl from './assets/Icon.svg';

const NAV = [
  { id: 'overview', label: 'Home', icon: 'pie' },
  { id: 'income', label: 'Income', icon: 'coins' },
  { id: 'expenses', label: 'Expenses', icon: 'cart' },
  { id: 'debt', label: 'Debt', icon: 'card' },
  { id: 'goals', label: 'Goals', icon: 'target' },
  { id: 'personal', label: 'Personal', icon: 'user' },
];

function fmtClock() {
  const d = new Date();
  return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
}

function StatusBar() {
  const [now, setNow] = useState(fmtClock);
  useEffect(() => { const id = setInterval(() => setNow(fmtClock()), 15000); return () => clearInterval(id); }, []);
  return (
    <div className="app-status">
      <span className="num">{now}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-2)' }}>
        <Icon name="wifi" size={15} />
        <span style={{ display: 'inline-block', width: 24, height: 12, border: '1.5px solid var(--text-2)', borderRadius: 3, position: 'relative' }}>
          <span style={{ position: 'absolute', top: 1.5, left: 1.5, bottom: 1.5, width: '65%', background: 'var(--text-2)', borderRadius: 1 }} />
        </span>
      </span>
    </div>
  );
}

function Shell() {
  const { state, update, reset } = useStore();
  const [tab, setTab] = useState(() => location.hash.replace('#', '') || 'overview');
  const [onb, setOnb] = useState(() => !onboarding.done());
  const [money, setMoney] = useState<null | 'salary' | 'extra'>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onHash() { const h = location.hash.replace('#', ''); if (h) setTab(h); }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function go(id: string) {
    setTab(id); location.hash = id;
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function finishOnb() { onboarding.finish(); setOnb(false); go('overview'); }
  function replayOnb() { onboarding.replay(); setOnb(true); }

  const b = useMemo(() => computeBudget(state), [state]);

  const screens: Record<string, React.ReactNode> = {
    overview: <Overview state={state} b={b} onNav={go} onMoneyIn={setMoney} />,
    income: <Income state={state} b={b} update={update} />,
    expenses: <Expenses state={state} b={b} update={update} />,
    debt: <Debt state={state} b={b} update={update} />,
    goals: <Goals state={state} b={b} update={update} />,
    personal: <Personal state={state} b={b} update={update} onNav={go} />,
  };

  return (
    <div className="device-bg">
      <div className="phone">
        <StatusBar />
        <header className="app-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={iconUrl} alt="" style={{ width: 30, height: 30 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>Mintly</div>
              <div className="eyebrow" style={{ fontSize: 8.5, marginTop: 2 }}>financial control</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pill color="var(--text-2)">{CADENCE[state.salary.cadence].label}</Pill>
            <button onClick={replayOnb} title="Re-run setup" style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text-2)' }}>
              <Icon name="flag" size={16} />
            </button>
          </div>
        </header>

        <div className="app-scroll" ref={scrollRef}>
          {screens[tab] || screens.overview}
        </div>

        <nav className="app-tabs">
          {NAV.map((n) => {
            const on = tab === n.id;
            return (
              <button key={n.id} onClick={() => go(n.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1,
                background: 'none', border: 'none', color: on ? 'var(--accent)' : 'var(--text-3)', padding: '6px 1px',
              }}>
                <Icon name={n.icon} size={20} />
                <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        {money && <MoneyIn kind={money} state={state} update={update} onClose={() => setMoney(null)} />}

        {onb && (
          <Onboarding
            onFinish={(draft) => { update(draft); finishOnb(); }}
            onSkip={() => { reset(); finishOnb(); }}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
