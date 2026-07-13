import { useStore } from '../store';
import { Btn } from '../ui';
import logoUrl from '../assets/Logo.svg';

export function Login() {
  const { signIn, authError } = useStore();
  return (
    <div className="login app-bg">
      <img src={logoUrl} alt="Mintly" style={{ height: 58, filter: 'drop-shadow(0 12px 30px color-mix(in oklch, var(--accent) 40%, transparent))' }} />
      <div>
        <h1 style={{ fontSize: 28, letterSpacing: '-0.03em' }}>Welcome back</h1>
        <p style={{ fontSize: 14.5, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.55, maxWidth: 340 }}>
          Sign in with Google and your budget syncs securely across all your devices —
          phone, laptop, anywhere.
        </p>
      </div>
      <Btn variant="primary" icon="user" onClick={signIn} style={{ padding: '13px 26px', fontSize: 15 }}>
        Continue with Google
      </Btn>
      {authError && (
        <div style={{
          maxWidth: 380, fontSize: 12.5, color: 'var(--rose)', background: 'color-mix(in oklch, var(--rose) 10%, transparent)',
          border: '1px solid color-mix(in oklch, var(--rose) 35%, transparent)', borderRadius: 10, padding: '10px 14px',
        }}>
          {authError}
        </div>
      )}
      <p style={{ fontSize: 11.5, color: 'var(--text-3)', maxWidth: 340, lineHeight: 1.5 }}>
        Only you can read your data — it's stored under your own account and protected by
        Firestore security rules.
      </p>
    </div>
  );
}
