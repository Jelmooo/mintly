import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '../store';
import { ConfirmDialog, Icon } from '../ui';

function MenuItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button className={`menu-item ${danger ? 'danger' : ''}`} onClick={onClick} role="menuitem">
      <Icon name={icon} size={17} />
      <span>{label}</span>
    </button>
  );
}

export function ProfileMenu({ onClose, onNav }: { onClose: () => void; onNav: (id: string) => void }) {
  const { cloud, user, setOnboarded, signOutUser } = useStore();
  const [confirm, setConfirm] = useState<null | 'restart' | 'signout'>(null);

  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const goTo = (id: string) => { onClose(); onNav(id); };

  const signedIn = cloud && user;
  const name = user?.displayName ?? 'Local account';
  const sub = signedIn ? `${user!.email} · Synced` : 'Local only — not signed in';

  return (
    <>
      <div className="menu-backdrop" onClick={onClose} />
      <div className="profile-menu" role="menu">
        <div className="menu-id">
          {user?.photoURL
            ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 38, height: 38, borderRadius: '50%', flex: '0 0 auto' }} />
            : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flex: '0 0 auto', color: 'var(--text-2)' }}><Icon name="user" size={19} /></div>}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
          </div>
        </div>

        <div className="menu-label">Edit your budget</div>
        <MenuItem icon="coins" label="Income & pay schedule" onClick={() => goTo('income')} />
        <MenuItem icon="cart" label="Fixed expenses" onClick={() => goTo('expenses')} />
        <MenuItem icon="card" label="Debts" onClick={() => goTo('debt')} />
        <MenuItem icon="target" label="Savings goals" onClick={() => goTo('goals')} />
        <MenuItem icon="shield" label="Pots" onClick={() => goTo('pots')} />

        <div className="menu-divider" />
        <MenuItem icon="gear" label="Payment tracking" onClick={() => goTo('settings')} />
        <MenuItem icon="flag" label="Restart onboarding" onClick={() => setConfirm('restart')} />

        {signedIn && (
          <>
            <div className="menu-divider" />
            <MenuItem icon="arrow" label="Sign out" danger onClick={() => setConfirm('signout')} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirm === 'restart'}
        title="Restart onboarding?"
        message={(
          <RestartMsg />
        )}
        confirmLabel="Restart setup"
        onCancel={() => setConfirm(null)}
        onConfirm={() => { setConfirm(null); onClose(); setOnboarded(false); }}
      />
      <ConfirmDialog
        open={confirm === 'signout'}
        danger
        title="Sign out?"
        message="You can sign back in anytime with Google — your budget stays safely synced to your account."
        confirmLabel="Sign out"
        onCancel={() => setConfirm(null)}
        onConfirm={() => { setConfirm(null); onClose(); void signOutUser(); }}
      />
    </>
  );
}

function RestartMsg(): ReactNode {
  return (
    <>
      This starts setup over from scratch. When you finish, your income, expenses, debts and goals
      are <b style={{ color: 'var(--text)' }}>replaced</b> with what you enter.
      <br /><br />
      To change just one thing, use <b style={{ color: 'var(--text)' }}>Edit your budget</b> above instead.
    </>
  );
}
