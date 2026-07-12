// goals.jsx — savings goals: prioritize (reorder) + deadlines + required/month.
const { useState: useStateGoals } = React;

function Goals({ state, b, update }) {
  const [edit, setEdit] = useStateGoals(null);

  function save(item) {
    if (item.id) update((s) => ({ ...s, goals: s.goals.map((g) => (g.id === item.id ? item : g)) }));
    else update((s) => ({ ...s, goals: [...s.goals, { ...item, id: "g" + Date.now(), priority: s.goals.length + 1 }] }));
    setEdit(null);
  }
  function del(id) { update((s) => ({ ...s, goals: reprioritize(s.goals.filter((g) => g.id !== id)) })); }
  function reprioritize(arr) { return [...arr].sort((a, c) => a.priority - c.priority).map((g, i) => ({ ...g, priority: i + 1 })); }
  function move(id, dir) {
    update((s) => {
      const sorted = [...s.goals].sort((a, c) => a.priority - c.priority);
      const i = sorted.findIndex((g) => g.id === id);
      const j = i + dir;
      if (j < 0 || j >= sorted.length) return s;
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      return { ...s, goals: sorted.map((g, k) => ({ ...g, priority: k + 1 })) };
    });
  }

  const goals = b.goals; // already sorted + funded by engine
  const totalSaved = goals.reduce((s, g) => s + (Number(g.saved) || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (Number(g.target) || 0), 0);

  return (
    <div className="fadeup" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHead title="Savings goals" sub="Dated goals are funded first by priority. Your top goal without a deadline catches everything left in your personal account."
        action={<Btn variant="primary" icon="plus" onClick={() => setEdit({ name: "", target: "", saved: 0, deadline: "" })}>Add goal</Btn>} />

      <StatRow items={[
        { label: "Saved so far", value: fmtEur(totalSaved), color: "oklch(0.78 0.13 200)" },
        { label: "Total targets", value: fmtEur(totalTarget), sub: Math.round(totalSaved / Math.max(1, totalTarget) * 100) + "% of all goals" },
        { label: "Funding / month", value: fmtEur(b.savingsTotal), sub: b.goalsUnderfunded ? "dated goals need " + fmtEur(b.datedRequired) : "on track", color: b.goalsUnderfunded ? "var(--amber)" : "var(--accent)" },
      ]} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {goals.length === 0 && <Card><Empty label="No goals yet — add your first." /></Card>}
        {goals.map((g, idx) => {
          const pct = Math.min(100, (g.saved / g.target) * 100);
          const open = !g.hasDeadline;
          const isTopOpen = open && b.topOpen && b.topOpen.id === g.id;
          const dl = open ? null : new Date(g.deadline);
          const monthsLeft = open ? null : Math.max(0, Math.ceil(monthsBetween(NOW, dl)));
          const ringColor = open ? "oklch(0.78 0.13 200)" : (g.onTrack ? "oklch(0.78 0.13 200)" : "var(--amber)");
          return (
            <Card key={g.id} style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              {/* priority controls */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: "0 0 auto" }}>
                <button onClick={() => move(g.id, -1)} disabled={idx === 0} style={arrowBtn(idx === 0)}><Icon name="arrow" size={14} style={{ transform: "rotate(-90deg)" }} /></button>
                <div className="mono" style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", background: "var(--bg-2)", border: "1px solid var(--line)", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{g.priority}</div>
                <button onClick={() => move(g.id, 1)} disabled={idx === goals.length - 1} style={arrowBtn(idx === goals.length - 1)}><Icon name="arrow" size={14} style={{ transform: "rotate(90deg)" }} /></button>
              </div>

              <Ring pct={pct} size={72} thickness={8} color={ringColor}>
                <div style={{ textAlign: "center" }}>
                  <div className="num mono" style={{ fontSize: 14, fontWeight: 600 }}>{Math.round(pct)}%</div>
                </div>
              </Ring>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: 17 }}>{g.name}</h3>
                  {open
                    ? (isTopOpen
                        ? <Pill color="oklch(0.78 0.13 200)"><Icon name="arrow" size={11} /> catches the rest</Pill>
                        : <Pill color="var(--text-2)">no deadline</Pill>)
                    : (g.onTrack ? <Pill color="oklch(0.78 0.13 200)"><Icon name="check" size={11} /> on track</Pill> : <Pill color="var(--amber)">underfunded</Pill>)}
                </div>
                <div className="num mono" style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6 }}>{fmtEur(g.saved)} <span style={{ color: "var(--text-3)" }}>/ {fmtEur(g.target)}</span></div>
                <div style={{ marginTop: 10, maxWidth: 360 }}><Bar pct={pct} color={ringColor} /></div>
              </div>

              <div style={{ display: "flex", gap: 26, flex: "0 0 auto" }}>
                {open ? (
                  <>
                    <Metric label="Deadline" value="None" sub="ongoing" />
                    <Metric label="To go" value={fmtEur(g.remaining)} sub={"of " + fmtEur(g.target)} />
                    <Metric label="Funding now" value={fmtEur(g.funded) + "/mo"} color={isTopOpen ? "oklch(0.78 0.13 200)" : "var(--text-3)"} sub={isTopOpen ? "from leftover" : "raise priority to fund"} />
                  </>
                ) : (
                  <>
                    <Metric label="Deadline" value={dl.toLocaleDateString("en-GB", { month: "short", year: "numeric" })} sub={monthsLeft + " mo left"} />
                    <Metric label="Need / mo" value={fmtEur(g.required)} sub={fmtEur(g.remaining) + " to go"} />
                    <Metric label="Funding now" value={fmtEur(g.funded) + "/mo"} color={g.onTrack ? "var(--accent)" : "var(--amber)"} sub={g.shortfall > 0.5 ? "−" + fmtEur(g.shortfall) + " short" : "covered"} />
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: 6, flex: "0 0 auto" }}>
                <IconBtn name="card" onClick={() => setEdit(g)} title="Edit" />
                <IconBtn name="trash" onClick={() => del(g.id)} title="Delete" danger />
              </div>
            </Card>
          );
        })}
      </div>

      <GoalSheet item={edit} onClose={() => setEdit(null)} onSave={save} />
    </div>
  );
}

function Metric({ label, value, sub, color }) {
  return (
    <div>
      <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
      <div className="num mono" style={{ fontSize: 15, marginTop: 5, color: color || "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function arrowBtn(disabled) {
  return { width: 26, height: 22, borderRadius: 7, display: "grid", placeItems: "center", background: "transparent", border: "1px solid var(--line)", color: disabled ? "var(--text-3)" : "var(--text-2)", opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer" };
}
function nextYear() { const d = new Date(NOW); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); }

function GoalSheet({ item, onClose, onSave }) {
  const [d, setD] = useStateGoals(item);
  React.useEffect(() => setD(item), [item]);
  if (!d) return null;
  const set = (k, v) => setD({ ...d, [k]: v });
  return (
    <Sheet open={!!item} onClose={onClose} title={item && item.id ? "Edit goal" : "Add goal"}
      footer={<>
        <Btn variant="dim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" onClick={() => onSave(d)} disabled={!d.name || !d.target}>Save</Btn>
      </>}>
      <Field label="Goal name"><TextInput value={d.name} onChange={(v) => set("name", v)} placeholder="e.g. Emergency buffer" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Target amount"><MoneyInput value={d.target} onChange={(v) => set("target", v)} /></Field>
        <Field label="Saved already"><MoneyInput value={d.saved} onChange={(v) => set("saved", v)} /></Field>
      </div>
      <Field label="Deadline">
        <Segmented value={d.deadline ? "yes" : "no"}
          options={[{ value: "no", label: "No deadline" }, { value: "yes", label: "By a date" }]}
          onChange={(v) => set("deadline", v === "yes" ? (d.deadline || nextYear()) : "")} />
      </Field>
      {d.deadline ? (
        <Field label="Target date" hint="We fund this first, dividing what's left by the months remaining.">
          <input type="date" value={d.deadline} onChange={(e) => set("deadline", e.target.value)} style={{
            width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text)",
            borderRadius: "var(--r-sm)", padding: "11px 14px", fontSize: 14.5, outline: "none", colorScheme: "dark",
          }} />
        </Field>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: -4, lineHeight: 1.5 }}>
          Open-ended. Your highest-priority goal without a deadline automatically catches everything left in your personal account each month.
        </div>
      )}
    </Sheet>
  );
}

Object.assign(window, { Goals });
