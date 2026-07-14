import { useStore } from '../store';
import type { TrackingMode } from '../types';
import { Btn, Card, Icon, PageHead } from '../ui';

const MODES: { value: TrackingMode; title: string; sub: string; icon: string }[] = [
  {
    value: 'manual',
    title: 'Manual input',
    sub: 'You type every income amount yourself, each time money arrives.',
    icon: 'card',
  },
  {
    value: 'fixed',
    title: 'Static / fixed',
    sub: 'Every period uses the same recurring amount automatically (your salary from the Income tab).',
    icon: 'cal',
  },
  {
    value: 'estimate',
    title: 'Estimated + manual override',
    sub: 'Mintly estimates from your recent incomes; you can always adjust it before confirming.',
    icon: 'trend',
  },
];

export function Settings() {
  const { state, update, cloud, user, signOutUser, setOnboarded } = useStore();
  const tracking = state.settings?.tracking ?? 'fixed';

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead title="Settings" sub="How Mintly registers your payments, and your account." />

      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Payment tracking</h3>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14 }}>
          Controls how the income amount is filled in when you press "Add income".
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MODES.map((m) => {
            const on = tracking === m.value;
            return (
              <button key={m.value}
                onClick={() => update((s) => ({ ...s, settings: { ...s.settings, tracking: m.value } }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  padding: '13px 14px', borderRadius: 12, cursor: 'pointer',
                  background: on ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'var(--bg-2)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`, color: 'var(--text)',
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flex: '0 0 auto', display: 'grid', placeItems: 'center',
                  background: `color-mix(in oklch, ${on ? 'var(--accent)' : 'var(--text-3)'} 14%, transparent)`,
                  color: on ? 'var(--accent)' : 'var(--text-2)',
                }}>
                  <Icon name={m.icon} size={18} />
                </div>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{m.title}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{m.sub}</span>
                </span>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flex: '0 0 auto', display: 'grid', placeItems: 'center',
                  border: `2px solid ${on ? 'var(--accent)' : 'var(--text-3)'}`,
                }}>
                  {on && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)' }} />}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Setup</h3>
        <Btn variant="ghost" icon="flag" onClick={() => setOnboarded(false)}>Re-run onboarding</Btn>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
          Walk through income, expenses, debts and goals again. Your current data stays until you finish.
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Account</h3>
        {cloud && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 36, height: 36, borderRadius: '50%' }} />}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user.displayName ?? 'Signed in'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{user.email} · synced</div>
            </div>
            <Btn variant="danger" onClick={() => { if (confirm('Sign out of Mintly?')) void signOutUser(); }}>Sign out</Btn>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Running in local-only mode — data stays in this browser.
          </div>
        )}
      </Card>
    </div>
  );
}
