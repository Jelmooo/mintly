import { useEffect, useMemo, useState } from 'react';
import { StoreProvider, useStore } from './store';
import { computeBudget, CADENCE } from './engine';
import { Icon, Pill } from './ui';
import { Overview } from './screens/Overview';
import { Income } from './screens/Income';
import { Expenses } from './screens/Expenses';
import { Debt } from './screens/Debt';
import { Goals } from './screens/Goals';
import { Settings } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { MoneyIn } from './screens/MoneyIn';
import { Login } from './screens/Login';
import iconUrl from './assets/Icon.svg';

const NAV = [
  { id: 'overview', label: 'Home', icon: 'pie' },
  { id: 'income', label: 'Income', icon: 'coins' },
  { id: 'expenses', label: 'Expenses', icon: 'cart' },
  { id: 'debt', label: 'Debt', icon: 'card' },
  { id: 'goals', label: 'Goals', icon: 'target' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
];

function Splash({ label }: { label: string }) {
  return (
    <div className="login app-bg">
      <img src={iconUrl} alt="" style={{ width: 44, height: 44, opacity: 0.9 }} />
      <p style={{ color: 'var(--text-2)', fontSize: 14 }}>{label}</p>
    </div>
  );
}

function Shell() {
  const { state, update, reset, cloud, user, authLoading, syncing, onboarded, setOnboarded, signOutUser } = useStore();
  const [tab, setTab] = useState(() => location.hash.replace('#', '') || 'overview');
  const [money, setMoney] = useState(false);

  useEffect(() => {
    function onHash() { const h = location.hash.replace('#', ''); if (h) setTab(h); }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function go(id: string) {
    setTab(id);
    location.hash = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const b = useMemo(() => computeBudget(state), [state]);

  if (cloud && authLoading) return <Splash label="Starting up…" />;
  if (cloud && !user) return <Login />;
  if (cloud && syncing) return <Splash label="Loading your budget…" />;

  const screens: Record<string, React.ReactNode> = {
    overview: <Overview state={state} b={b} onNav={go} onMoneyIn={() => setMoney(true)} />,
    income: <Income state={state} b={b} update={update} />,
    expenses: <Expenses state={state} b={b} update={update} />,
    debt: <Debt state={state} b={b} update={update} />,
    goals: <Goals state={state} b={b} update={update} />,
    settings: <Settings />,
  };

  return (
    <div className="site">
      <header className="site-head">
        <div className="brand">
          <img src={iconUrl} alt="" style={{ width: 32, height: 32 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>Mintly</div>
            <div className="eyebrow" style={{ fontSize: 8.5, marginTop: 2 }}>financial control</div>
          </div>
        </div>
        <div className="head-right">
          {!cloud && <Pill color="var(--amber)" style={{ flexShrink: 0 }}>no sync</Pill>}
          <Pill color="var(--text-2)" style={{ flexShrink: 0 }}>{CADENCE[state.salary.cadence].label}</Pill>
          <button onClick={() => setOnboarded(false)} title="Re-run setup" className="head-btn">
            <Icon name="flag" size={16} />
          </button>
          {cloud && user && (
            <button
              className="head-btn"
              title={`Signed in as ${user.displayName ?? user.email ?? ''} — click to sign out`}
              onClick={() => { if (confirm('Sign out of Mintly?')) void signOutUser(); }}
            >
              {user.photoURL
                ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                : <Icon name="user" size={16} />}
            </button>
          )}
        </div>
      </header>

      <nav className="tabs">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => go(n.id)} className={`tab-btn ${tab === n.id ? 'on' : ''}`}>
            <Icon name={n.icon} size={20} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <main className="site-main">
        {screens[tab] || screens.overview}
      </main>

      {money && <MoneyIn state={state} update={update} onClose={() => setMoney(false)} />}

      {!onboarded && (
        <Onboarding
          onFinish={(draft) => { update(draft); setOnboarded(true); go('overview'); }}
          onSkip={() => { reset(); setOnboarded(true); go('overview'); }}
        />
      )}
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
