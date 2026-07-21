import { useState } from 'react';
import { useStore } from '../store';
import type { TrackingMode } from '../types';
import { Card, ConfirmDialog, Icon, PageHead } from '../ui';

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

const EDIT_LINKS: { id: string; label: string; sub: string; icon: string }[] = [
  { id: 'income', label: 'Income & pay schedule', sub: 'Amount and how often you get paid', icon: 'coins' },
  { id: 'expenses', label: 'Fixed expenses', sub: 'Recurring bills and their paydate', icon: 'cart' },
  { id: 'debt', label: 'Debts', sub: 'Balances and monthly payments', icon: 'card' },
  { id: 'goals', label: 'Savings goals', sub: 'Targets and deadlines', icon: 'target' },
];

export function Settings({ onNav }: { onNav: (id: string) => void }) {
  const { state, update, cloud, user, setOnboarded } = useStore();
  const tracking = state.settings?.tracking ?? 'fixed';
  const [restart, setRestart] = useState(false);

  return (
    <div className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead title="Settings" sub="Change anything you set up, and how Mintly registers payments." />

      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Edit your budget</h3>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14 }}>
          Change anything you entered during onboarding — no need to start over.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {EDIT_LINKS.map((l) => (
            <button key={l.id} onClick={() => onNav(l.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text)',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flex: '0 0 auto', display: 'grid', placeItems: 'center', background: 'var(--surface-2)', color: 'var(--accent)' }}>
                <Icon name={l.icon} size={17} />
              </div>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{l.label}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{l.sub}</span>
              </span>
              <Icon name="arrow" size={15} stroke="var(--text-3)" />
            </button>
          ))}
        </div>
      </Card>

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
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Start over</h3>
        <button onClick={() => setRestart(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 999,
          background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--text)', fontSize: 13.5, fontWeight: 600,
        }}>
          <Icon name="flag" size={15} /> Restart onboarding
        </button>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
          Re-enter everything from scratch. To change just one thing, use "Edit your budget" above.
        </div>
      </Card>

      {cloud && user && (
        <Card>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 36, height: 36, borderRadius: '50%' }} />}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user.displayName ?? 'Signed in'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{user.email} · synced across your devices</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>
            Sign out from the account menu (your avatar, top right).
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={restart}
        title="Restart onboarding?"
        message={<>This starts setup over from scratch. When you finish, your income, expenses, debts and goals are <b style={{ color: 'var(--text)' }}>replaced</b> with what you enter.</>}
        confirmLabel="Restart setup"
        onCancel={() => setRestart(false)}
        onConfirm={() => { setRestart(false); setOnboarded(false); }}
      />
    </div>
  );
}
