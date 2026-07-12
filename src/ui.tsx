import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { CATEGORIES, type CatDef } from './engine';

// ---------- icons ----------
export const ICON_PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9.5 21v-6h5v6',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
  cart: 'M3 4h2l2.2 11.5a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6.5M9 20a1 1 0 1 0 0 .01M17 20a1 1 0 1 0 0 .01',
  bus: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM4 11h16M8 17v2M16 17v2M8 7h8',
  play: 'M5 4v16l13-8-13-8z',
  shield: 'M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3z',
  wifi: 'M2 8.5a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0M12 19h.01',
  dot: 'M12 12h.01',
  wallet: 'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 1-2-2zM3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H6M17 13h.01',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13',
  check: 'M5 12.5 10 17 19 7',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 12h.01',
  flag: 'M5 21V4M5 4c3-1.5 6 1.5 9 0s5-1 5-1v9s-2 .5-5 1-6-1.5-9 0',
  card: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 10h18M7 15h4',
  pie: 'M12 3v9h9a9 9 0 1 1-9-9zM14 3.5A9 9 0 0 1 20.5 10H14V3.5z',
  cal: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM4 9h16M8 3v4M16 3v4',
  trend: 'M3 17l5-5 4 4 8-8M16 8h5v5',
  coins: 'M12 7c4 0 7-1 7-2.5S16 2 12 2 5 3 5 4.5 8 7 12 7zM5 4.5v5c0 1.5 3 2.5 7 2.5s7-1 7-2.5v-5M5 9.5v5c0 1.5 3 2.5 7 2.5s7-1 7-2.5v-5',
  cup: 'M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8zM16 9h2.5a2 2 0 0 1 0 4H16M7 3v2M10 3v2M13 3v2',
  bag: 'M6 8h12l-1 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8zM9 8V6a3 3 0 0 1 6 0v2',
  film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9.3h4M16 9.3h4M4 14.6h4M16 14.6h4',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.2A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0',
};

export function Icon({ name, size = 18, stroke = 'currentColor', fill = 'none', style }: {
  name: string; size?: number; stroke?: string; fill?: string; style?: CSSProperties;
}) {
  const p = ICON_PATHS[name] || ICON_PATHS.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={p} />
    </svg>
  );
}

export function Card({ children, style, pad = true, className = '', ...rest }: {
  children: ReactNode; style?: CSSProperties; pad?: boolean; className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow)',
      padding: pad ? 'var(--pad)' : 0, ...style,
    }} {...rest}>{children}</div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; size?: 'sm' | 'md';
}) {
  return (
    <div style={{
      display: 'inline-flex', gap: 3, padding: 3, background: 'var(--bg-2)',
      border: '1px solid var(--line)', borderRadius: 999, flexWrap: 'wrap',
    }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            border: 'none', borderRadius: 999, cursor: 'pointer',
            padding: size === 'sm' ? '6px 12px' : '8px 16px',
            fontSize: size === 'sm' ? 12.5 : 13.5, fontWeight: 600, letterSpacing: '-0.01em',
            background: active ? 'var(--text)' : 'transparent',
            color: active ? 'var(--bg)' : 'var(--text-2)', transition: 'all .18s ease',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

export function MoneyInput({ value, onChange, prefix = '€', placeholder = '0', style, align = 'left' }: {
  value: number | ''; onChange: (v: number | '') => void;
  prefix?: string; placeholder?: string; style?: CSSProperties; align?: 'left' | 'right';
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', ...style }}>
      <span className="mono" style={{ position: 'absolute', left: 14, color: 'var(--text-3)', fontSize: 15, pointerEvents: 'none' }}>{prefix}</span>
      <input type="number" inputMode="decimal" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="num mono" style={{
          width: '100%', background: 'var(--bg-2)', border: '1px solid var(--line)',
          color: 'var(--text)', borderRadius: 'var(--r-sm)', padding: '11px 14px 11px 30px',
          fontSize: 16, textAlign: align, outline: 'none',
        }} />
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, style }: {
  value: string; onChange: (v: string) => void; placeholder?: string; style?: CSSProperties;
}) {
  return (
    <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', background: 'var(--bg-2)', border: '1px solid var(--line)',
        color: 'var(--text)', borderRadius: 'var(--r-sm)', padding: '11px 14px',
        fontSize: 16, outline: 'none', ...style,
      }} />
  );
}

export function DateInput({ value, onChange, style }: {
  value: string; onChange: (v: string) => void; style?: CSSProperties;
}) {
  return (
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)} style={{
      width: '100%', background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text)',
      borderRadius: 'var(--r-sm)', padding: '11px 14px', fontSize: 16, outline: 'none', colorScheme: 'dark', ...style,
    }} />
  );
}

export function Select({ value, onChange, options, style }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; style?: CSSProperties;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{
      width: '100%', background: 'var(--bg-2)', border: '1px solid var(--line)',
      color: 'var(--text)', borderRadius: 'var(--r-sm)', padding: '11px 12px',
      fontSize: 16, outline: 'none', appearance: 'none', cursor: 'pointer', ...style,
    }}>
      {options.map((o) => <option key={o.value} value={o.value} style={{ background: '#1b1f25' }}>{o.label}</option>)}
    </select>
  );
}

type BtnVariant = 'primary' | 'solid' | 'ghost' | 'dim' | 'danger';
export function Btn({ children, onClick, variant = 'ghost', size = 'md', icon, style, disabled }: {
  children: ReactNode; onClick?: () => void; variant?: BtnVariant; size?: 'sm' | 'md';
  icon?: string; style?: CSSProperties; disabled?: boolean;
}) {
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid transparent',
    borderRadius: 999, fontWeight: 600, letterSpacing: '-0.01em', transition: 'all .16s ease',
    padding: size === 'sm' ? '7px 13px' : '10px 18px', fontSize: size === 'sm' ? 13 : 14,
    opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer',
  };
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#06160c' },
    solid: { background: 'var(--text)', color: 'var(--bg)' },
    ghost: { background: 'var(--surface-2)', color: 'var(--text)', borderColor: 'var(--line)' },
    dim: { background: 'transparent', color: 'var(--text-2)', borderColor: 'var(--line)' },
    danger: { background: 'transparent', color: 'var(--rose)', borderColor: 'oklch(0.74 0.15 18 / 0.4)' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
    </button>
  );
}

export function IconBtn({ name, onClick, title, danger, size = 16 }: {
  name: string; onClick?: () => void; title?: string; danger?: boolean; size?: number;
}) {
  return (
    <button onClick={onClick} title={title} style={{
      display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10,
      background: 'transparent', border: '1px solid var(--line)',
      color: danger ? 'var(--rose)' : 'var(--text-2)',
    }}>
      <Icon name={name} size={size} />
    </button>
  );
}

export function Bar({ pct, color = 'var(--accent)', track = 'var(--bg-2)', h = 8, delay = 0 }: {
  pct: number; color?: string; track?: string; h?: number; delay?: number;
}) {
  return (
    <div style={{ width: '100%', height: h, background: track, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: Math.max(0, Math.min(100, pct)) + '%', background: color,
        borderRadius: 999, transformOrigin: 'left', animation: `growW .7s ${delay}s cubic-bezier(.2,.8,.2,1)`,
      }} />
    </div>
  );
}

export function Ring({ pct, size = 64, color = 'var(--accent)', track = 'var(--bg-2)', thickness = 8, children }: {
  pct: number; size?: number; color?: string; track?: string; thickness?: number; children?: ReactNode;
}) {
  const p = Math.max(0, Math.min(100, pct));
  const mask = `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: `conic-gradient(${color} ${p * 3.6}deg, ${track} 0)`,
        mask, WebkitMask: mask,
      }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  );
}

export function CatDot({ category, size = 32, cats }: { category: string; size?: number; cats?: Record<string, CatDef> }) {
  const map = cats || CATEGORIES;
  const c = map[category] || map.other || { color: 'var(--text-3)', icon: 'dot', label: '' };
  return (
    <div style={{
      width: size, height: size, borderRadius: 9, display: 'grid', placeItems: 'center',
      background: `color-mix(in oklch, ${c.color} 16%, transparent)`, color: c.color, flex: '0 0 auto',
    }}>
      <Icon name={c.icon} size={size * 0.52} />
    </div>
  );
}

export function Sheet({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 200, background: 'oklch(0 0 0 / 0.55)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(540px, 100%)', background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0', boxShadow: '0 -10px 60px -10px oklch(0 0 0 / 0.8)',
        animation: 'pop .26s cubic-bezier(.2,.8,.2,1) both', maxHeight: '92%', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 12px' }}>
          <h3 style={{ fontSize: 19 }}>{title}</h3>
          <button onClick={onClose} title="Close" style={{
            display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10,
            background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-2)', transform: 'rotate(45deg)',
          }}><Icon name="plus" size={18} /></button>
        </div>
        <div style={{ padding: '4px 22px 20px', overflowY: 'auto' }}>{children}</div>
        {footer && <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 7 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{hint}</div>}
    </label>
  );
}

export function Pill({ children, color = 'var(--text-2)', bg, style }: {
  children: ReactNode; color?: string; bg?: string; style?: CSSProperties;
}) {
  return (
    <span className="mono" style={{
      fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', padding: '4px 9px', borderRadius: 999,
      color, background: bg || `color-mix(in oklch, ${color} 14%, transparent)`,
      display: 'inline-flex', alignItems: 'center', gap: 5, ...style,
    }}>{children}</span>
  );
}

export function StatRow({ items }: { items: { label: string; value: ReactNode; sub?: string; color?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 1, background: 'var(--line-2)', borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--line)' }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: 'var(--surface)', padding: '16px 16px' }}>
          <div className="eyebrow" style={{ marginBottom: 8, fontSize: 10 }}>{it.label}</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', color: it.color || 'var(--text)' }}>{it.value}</div>
          {it.sub && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 24, letterSpacing: '-0.03em' }}>{title}</h2>
        {sub && <div style={{ fontSize: 13.5, color: 'var(--text-3)', marginTop: 5 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ label }: { label: string }) {
  return <div style={{ background: 'var(--surface)', padding: '26px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>{label}</div>;
}
