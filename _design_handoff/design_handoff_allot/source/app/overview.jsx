// overview.jsx — home: hero "left to budget", allocation waterfall, two-account flow.
const { useMemo: useMemoOv } = React;

function StatRow({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 1, background: "var(--line-2)", borderRadius: "var(--r)", overflow: "hidden", border: "1px solid var(--line)" }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: "var(--surface)", padding: "16px 18px" }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{it.label}</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em", color: it.color || "var(--text)" }}>{it.value}</div>
          {it.sub && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// the spine of the app: a stacked allocation bar
function WaterfallBar({ b }) {
  const segs = [
    { key: "exp",  label: "Fixed expenses", v: b.expensesTotal,       color: "var(--blue)" },
    { key: "debt", label: "Debt",           v: b.debtTotal,           color: "var(--violet)" },
    { key: "sav",  label: "Dated goals",    v: b.datedFunded,         color: "oklch(0.78 0.13 200)" },
    { key: "bud",  label: "Personal budget", v: b.personalBudgetsTotal, color: "var(--accent)" },
    { key: "swp",  label: b.topOpen ? ("\u2192 " + b.topOpen.name) : "Free", v: b.topOpen ? b.sweep : Math.max(0, b.personalFree), color: "oklch(0.72 0.13 200)" },
  ].filter((s) => s.v > 0);
  const total = segs.reduce((s, x) => s + x.v, 0) || 1;
  return (
    <div>
      <div style={{ display: "flex", height: 46, borderRadius: 12, overflow: "hidden", gap: 2, background: "var(--bg-2)" }}>
        {segs.map((s, i) => (
          <div key={s.key} title={`${s.label}: ${fmtEur(s.v)}`} style={{
            width: (s.v / total * 100) + "%", background: s.color, minWidth: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: `growW .6s ${i * 0.08}s cubic-bezier(.2,.8,.2,1)`, transformOrigin: "left",
          }}>
            {s.v / total > 0.1 && <span className="num mono" style={{ fontSize: 12, fontWeight: 600, color: "oklch(0.18 0.02 255)" }}>{fmtEur(s.v)}</span>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", marginTop: 14 }}>
        {segs.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />
            <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{s.label}</span>
            <span className="num mono" style={{ fontSize: 12.5, color: "var(--text)" }}>{fmtEur(s.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountFlow({ b, state }) {
  const Acc = ({ name, role, amount, color, items }) => (
    <div style={{ flex: 1, minWidth: 220, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in oklch, ${color} 18%, transparent)`, color, display: "grid", placeItems: "center" }}>
          <Icon name="wallet" size={19} />
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{name}</div>
          <div className="eyebrow" style={{ fontSize: 10 }}>{role}</div>
        </div>
      </div>
      <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", color }}>{fmtEur(amount)}</div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text-2)" }}>{it.label}</span>
            <span className="num mono" style={{ color: it.pos ? "var(--accent)" : "var(--text)" }}>{it.pos ? "+" : "−"}{fmtEur(it.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <Acc name={state.meta.mainName} role="Income · expenses · dated savings" color="var(--blue)" amount={b.incomeTotal}
        items={[
          { label: "Income in", v: b.incomeTotal, pos: true },
          { label: "Fixed expenses", v: b.expensesTotal },
          { label: "Debt", v: b.debtTotal },
          { label: "Dated goals", v: b.datedFunded },
        ]} />
      <div style={{ display: "grid", placeItems: "center", color: "var(--text-3)", flex: "0 0 auto" }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>pay yourself</div>
        <Icon name="arrow" size={26} />
        <div className="num mono" style={{ fontSize: 12, color: "var(--accent)", marginTop: 4 }}>{fmtEur(b.paidToPersonal)}/mo</div>
      </div>
      <Acc name={state.meta.personalName} role="Budgets · auto-save" color="var(--accent)" amount={b.paidToPersonal}
        items={[
          { label: "Paid in", v: b.paidToPersonal, pos: true },
          { label: "Spending budgets", v: b.personalBudgetsTotal },
          b.topOpen
            ? { label: "Into " + b.topOpen.name, v: b.sweep }
            : { label: "Free to spend", v: Math.max(0, b.personalFree), pos: true },
        ]} />
    </div>
  );
}

function Overview({ state, b, onNav }) {
  const dim = b.paidToPersonal < 0 || b.personalOver;
  return (
    <div className="fadeup" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* HERO */}
      <Card style={{ position: "relative", overflow: "hidden", padding: "30px var(--pad)" }}>
        <div style={{ position: "absolute", right: -60, top: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, var(--accent), transparent 70%)", opacity: 0.10, pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 18, alignItems: "flex-start" }}>
          <div>
            <div className="eyebrow">{dim ? "You're over budget" : "Paid to your personal account"}</div>
            <div className="num" style={{ fontSize: "clamp(44px, 7vw, 72px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1, marginTop: 10, color: dim ? "var(--rose)" : "var(--accent)" }}>
              {fmtEur(b.paidToPersonal)}
            </div>
            <div style={{ fontSize: 14.5, color: "var(--text-2)", marginTop: 12, maxWidth: 460, lineHeight: 1.5 }}>
              {b.personalOver
                ? <>Your personal budgets total <b style={{ color: "var(--text)" }}>{fmtEur(b.personalBudgetsTotal)}</b> — more than you pay yourself. Trim a budget to balance.</>
                : b.paidToPersonal < 0
                  ? <>Your fixed costs and dated goals leave nothing for your personal account. Ease up upstream to balance.</>
                  : b.topOpen
                    ? <><b style={{ color: "var(--text)" }}>{fmtEur(b.personalBudgetsTotal)}</b> covers your spending budgets and <b style={{ color: "var(--text)" }}>{fmtEur(b.sweep)}</b> sweeps into <b style={{ color: "var(--text)" }}>{b.topOpen.name}</b> each month.</>
                    : <><b style={{ color: "var(--text)" }}>{fmtEur(b.personalBudgetsTotal)}</b> covers your budgets, leaving <b style={{ color: "var(--text)" }}>{fmtEur(Math.max(0, b.personalFree))}</b> free. Add a goal with no deadline to auto-save it.</>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="eyebrow">Monthly income</div>
            <div className="num" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 6 }}>{fmtEur(b.incomeTotal)}</div>
            <Pill color="var(--text-2)" style={{ marginTop: 10 }}>{CADENCE[state.salary.cadence].label} salary</Pill>
          </div>
        </div>
        <div style={{ marginTop: 26 }}>
          <WaterfallBar b={b} />
        </div>
      </Card>

      {(b.overAllocated || b.goalsUnderfunded || b.personalOver) && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 18px", background: "color-mix(in oklch, var(--amber) 12%, var(--surface))", border: "1px solid color-mix(in oklch, var(--amber) 35%, transparent)", borderRadius: "var(--r)" }}>
          <div style={{ color: "var(--amber)", flex: "0 0 auto" }}><Icon name="flag" size={20} /></div>
          <div style={{ fontSize: 13.5, color: "var(--text)" }}>
            {b.overAllocated
              ? "Your fixed expenses and debt payments are higher than your income. There's nothing left to allocate."
              : b.personalOver
                ? "Your personal budgets are bigger than what you pay yourself — nothing sweeps into savings."
                : "Your dated goals need more than what's left after expenses and debt. Lower-priority dated goals are underfunded — adjust deadlines or amounts."}
          </div>
        </div>
      )}

      {/* two columns */}
      <div className="ov-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 16 }}>Your two accounts</h3>
            <Pill color="var(--blue)"><Icon name="arrow" size={12} /> auto-allocated</Pill>
          </div>
          <AccountFlow b={b} state={state} />
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>Savings plan</h3>
            <button onClick={() => onNav("goals")} style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}>Manage <Icon name="arrow" size={13} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {b.goals.map((g) => {
              const pct = Math.min(100, (g.saved / g.target) * 100);
              const open = !g.hasDeadline;
              const isTopOpen = open && b.topOpen && b.topOpen.id === g.id;
              const col = open ? "oklch(0.78 0.13 200)" : (g.onTrack ? "var(--accent)" : "var(--amber)");
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Ring pct={pct} size={52} thickness={6} color={col}>
                    <span className="num mono" style={{ fontSize: 11, fontWeight: 600 }}>{Math.round(pct)}</span>
                  </Ring>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</span>
                      <span className="num mono" style={{ fontSize: 13, color: col }}>{fmtEur(g.funded)}/mo</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                      {fmtEur(g.saved)} of {fmtEur(g.target)} · {open ? (isTopOpen ? "catches the rest" : "no deadline") : (g.onTrack ? "on track" : "needs " + fmtEur(g.required) + "/mo")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* where money goes */}
      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 18 }}>Where your money goes</h3>
        <SpendBreakdown b={b} onNav={onNav} />
      </Card>
    </div>
  );
}

function SpendBreakdown({ b, onNav }) {
  const cats = b.cats || CATEGORIES;
  const catRows = Object.entries(b.expByCat).map(([k, v]) => ({ k, v, ...(cats[k] || cats.other) })).sort((a, c) => c.v - a.v);
  const rows = [
    ...catRows.map((c) => ({ label: c.label, v: c.v, color: c.color, cat: c.k })),
    { label: "Debt", v: b.debtTotal, color: "var(--violet)" },
    { label: "Savings", v: b.savingsTotal, color: "oklch(0.78 0.13 200)" },
    { label: "Personal budget", v: b.personalBudgetsTotal, color: "var(--accent)" },
  ].filter((r) => r.v > 0);
  const total = rows.reduce((s, r) => s + r.v, 0) || 1;
  const conic = (() => {
    let acc = 0; const stops = rows.map((r) => { const a = acc; acc += r.v / total * 360; return `${r.color} ${a}deg ${acc}deg`; });
    return `conic-gradient(${stops.join(",")})`;
  })();
  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ position: "relative", width: 150, height: 150, flex: "0 0 auto" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: conic, mask: "radial-gradient(farthest-side, transparent 56%, #000 56%)", WebkitMask: "radial-gradient(farthest-side, transparent 56%, #000 56%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <div className="eyebrow" style={{ fontSize: 9 }}>per month</div>
            <div className="num" style={{ fontSize: 19, fontWeight: 600 }}>{fmtEur(total)}</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 260, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 22px" }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: r.color, flex: "0 0 auto" }} />
            <span style={{ fontSize: 13, color: "var(--text-2)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
            <span className="num mono" style={{ fontSize: 13 }}>{fmtEur(r.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Overview, StatRow });
