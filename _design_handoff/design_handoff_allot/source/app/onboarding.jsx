// onboarding.jsx — first-run placeholder wizard. Fills income, expenses, debts, goals, personal money.
const { useState: useStateOnb } = React;

const ONB_STEPS = [
  { key: "welcome" },
  { key: "income",   title: "Your income",     icon: "coins",  sub: "How are you paid?" },
  { key: "expenses", title: "Fixed expenses",  icon: "cart",   sub: "Recurring bills from your main account" },
  { key: "debts",    title: "Debts",           icon: "card",   sub: "Track what you owe — optional" },
  { key: "goals",    title: "Savings goals",   icon: "target", sub: "What are you saving for?" },
  { key: "personal", title: "Personal money",  icon: "wallet", sub: "Budgets for your spending account" },
  { key: "done",     title: "You're all set",  icon: "check" },
];
const ONB_INPUT_STEPS = 5; // income..personal

function uid(p) { return p + Math.random().toString(36).slice(2, 8); }

function Onboarding({ onFinish, onSample, onSkip }) {
  const [step, setStep] = useStateOnb(0);
  const [draft, setDraft] = useStateOnb(() => JSON.parse(JSON.stringify(EMPTY)));
  const meta = ONB_STEPS[step];

  // per-step "new row" drafts
  const [exp, setExp] = useStateOnb({ name: "", category: "housing", amount: "", payday: 1 });
  const [debt, setDebt] = useStateOnb({ name: "", balance: "", monthly: "" });
  const [goal, setGoal] = useStateOnb({ name: "", target: "", saved: 0, deadline: "" });
  const [pers, setPers] = useStateOnb({ name: "", category: "groceries", amount: "" });
  const [extra, setExtra] = useStateOnb({ kind: "travel", name: "", amount: "", freq: "monthly" });

  const setSalary = (k, v) => setDraft((d) => ({ ...d, salary: { ...d.salary, [k]: v } }));
  const pushTo = (key, item) => setDraft((d) => ({ ...d, [key]: [...d[key], item] }));
  const removeFrom = (key, id) => setDraft((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));

  const next = () => setStep((s) => Math.min(ONB_STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 160, background: "var(--bg)", display: "flex", flexDirection: "column" }} className="app-bg">
      {step === 0 ? (
        <Welcome onStart={() => setStep(1)} onSample={onSample} />
      ) : (
        <>
          {/* progress header */}
          <div style={{ flex: "0 0 auto", padding: "20px 20px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <button onClick={back} style={onbGhost}><Icon name="arrow" size={16} style={{ transform: "rotate(180deg)" }} /></button>
              {meta.key !== "done" && (
                <div style={{ display: "flex", gap: 6 }}>
                  {Array.from({ length: ONB_INPUT_STEPS }).map((_, i) => (
                    <span key={i} style={{ width: i + 1 === step ? 22 : 7, height: 7, borderRadius: 99, background: i + 1 <= step ? "var(--accent)" : "var(--surface-hi)", transition: "all .25s ease" }} />
                  ))}
                </div>
              )}
              {meta.key !== "done"
                ? <button onClick={onSkip} style={{ ...onbGhost, width: "auto", padding: "0 10px", fontSize: 12.5, color: "var(--text-3)" }}>Skip all</button>
                : <span style={{ width: 36 }} />}
            </div>
            {meta.key !== "done" && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "color-mix(in oklch, var(--accent) 16%, transparent)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                  <Icon name={meta.icon} size={21} />
                </div>
                <div>
                  <h2 style={{ fontSize: 21, letterSpacing: "-0.02em" }}>{meta.title}</h2>
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>{meta.sub}</div>
                </div>
              </div>
            )}
          </div>

          {/* step body */}
          <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "8px 18px 16px" }}>
            {meta.key === "income" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>How often are you paid?</div>
                  <Segmented value={draft.salary.cadence}
                    options={[{ value: "weekly", label: "Weekly" }, { value: "fourweek", label: "4-weekly" }, { value: "monthly", label: "Monthly" }]}
                    onChange={(v) => setSalary("cadence", v)} />
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Take-home pay each {CADENCE[draft.salary.cadence].label.toLowerCase()}</div>
                  <MoneyInput value={draft.salary.amount} onChange={(v) => setSalary("amount", v)} />
                  {draft.salary.amount ? <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>≈ {fmtEur(salaryMonthly(draft.salary))} / month</div> : null}
                </div>

                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>Allowances & extras — optional</div>
                  {draft.income.map((x) => (
                    <OnbRow key={x.id} icon="coins" color="var(--accent)" title={x.name || INCOME_KINDS[x.kind].label}
                      meta={x.freq === "yearly" ? "yearly" : "monthly"} amount={"+" + fmtEur(x.amount || 0)} onRemove={() => removeFrom("income", x.id)} />
                  ))}
                  <QuickAdd onAdd={() => { if (!extra.amount) return; pushTo("income", { ...extra, id: uid("i"), name: extra.name || INCOME_KINDS[extra.kind].label }); setExtra({ kind: "travel", name: "", amount: "", freq: "monthly" }); }} canAdd={!!extra.amount}>
                    <Select value={extra.kind} onChange={(v) => setExtra({ ...extra, kind: v })}
                      options={Object.entries(INCOME_KINDS).filter(([k]) => k !== "salary").map(([value, m]) => ({ value, label: m.label }))} />
                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 10 }}>
                      <MoneyInput value={extra.amount} onChange={(v) => setExtra({ ...extra, amount: v })} />
                      <Segmented value={extra.freq} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} onChange={(v) => setExtra({ ...extra, freq: v })} />
                    </div>
                  </QuickAdd>
                </div>
              </div>
            )}

            {meta.key === "expenses" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {draft.expenses.map((e) => (
                  <OnbRow key={e.id} catKey={e.category} title={e.name} meta={(CATEGORIES[e.category] || CATEGORIES.other).label + " · " + ordinal(e.payday)} amount={fmtEur(e.amount || 0)} onRemove={() => removeFrom("expenses", e.id)} />
                ))}
                <QuickAdd onAdd={() => { if (!exp.name || !exp.amount) return; pushTo("expenses", { ...exp, id: uid("e") }); setExp({ name: "", category: "housing", amount: "", payday: 1 }); }} canAdd={!!exp.name && !!exp.amount}>
                  <TextInput value={exp.name} onChange={(v) => setExp({ ...exp, name: v })} placeholder="e.g. Apartment rent" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Select value={exp.category} onChange={(v) => setExp({ ...exp, category: v })}
                      options={Object.entries(CATEGORIES).map(([value, c]) => ({ value, label: c.label }))} />
                    <MoneyInput value={exp.amount} onChange={(v) => setExp({ ...exp, amount: v })} />
                  </div>
                  <Select value={String(exp.payday)} onChange={(v) => setExp({ ...exp, payday: Number(v) })}
                    options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: "Payday " + ordinal(i + 1) }))} />
                </QuickAdd>
              </div>
            )}

            {meta.key === "debts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {draft.debts.map((d2) => (
                  <OnbRow key={d2.id} icon="card" color="var(--violet)" title={d2.name} meta={fmtEur(d2.monthly || 0) + "/mo"} amount={fmtEur(d2.balance || 0)} onRemove={() => removeFrom("debts", d2.id)} />
                ))}
                <QuickAdd onAdd={() => { if (!debt.name || debt.balance === "") return; pushTo("debts", { ...debt, id: uid("d"), start: Number(debt.balance) || 0, apr: "" }); setDebt({ name: "", balance: "", monthly: "" }); }} canAdd={!!debt.name && debt.balance !== ""}>
                  <TextInput value={debt.name} onChange={(v) => setDebt({ ...debt, name: v })} placeholder="e.g. Credit card" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Balance</div><MoneyInput value={debt.balance} onChange={(v) => setDebt({ ...debt, balance: v })} /></div>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Monthly</div><MoneyInput value={debt.monthly} onChange={(v) => setDebt({ ...debt, monthly: v })} /></div>
                  </div>
                </QuickAdd>
              </div>
            )}

            {meta.key === "goals" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {draft.goals.map((g, i) => (
                  <OnbRow key={g.id} icon="target" color="oklch(0.78 0.13 200)" title={g.name} meta={g.deadline ? "by " + new Date(g.deadline).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "no deadline"} amount={fmtEur(g.target || 0)} onRemove={() => removeFrom("goals", g.id)} />
                ))}
                <QuickAdd onAdd={() => { if (!goal.name || !goal.target) return; pushTo("goals", { ...goal, id: uid("g"), priority: draft.goals.length + 1 }); setGoal({ name: "", target: "", saved: 0, deadline: "" }); }} canAdd={!!goal.name && !!goal.target}>
                  <TextInput value={goal.name} onChange={(v) => setGoal({ ...goal, name: v })} placeholder="e.g. Emergency buffer" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Target</div><MoneyInput value={goal.target} onChange={(v) => setGoal({ ...goal, target: v })} /></div>
                    <div><div className="eyebrow" style={{ marginBottom: 6 }}>Saved</div><MoneyInput value={goal.saved} onChange={(v) => setGoal({ ...goal, saved: v })} /></div>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>Deadline</div>
                    <Segmented value={goal.deadline ? "yes" : "no"}
                      options={[{ value: "no", label: "None" }, { value: "yes", label: "By a date" }]}
                      onChange={(v) => setGoal({ ...goal, deadline: v === "yes" ? onbNextYear() : "" })} />
                    {goal.deadline ? <input type="date" value={goal.deadline} onChange={(e) => setGoal({ ...goal, deadline: e.target.value })} style={onbDate} /> : null}
                  </div>
                </QuickAdd>
              </div>
            )}

            {meta.key === "personal" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 2 }}>
                  These come out of the money you pay yourself. Whatever's left auto-saves into your top no-deadline goal.
                </div>
                {draft.personalBudgets.map((p) => (
                  <OnbRow key={p.id} catKey={p.category} cats={PCATS} title={p.name} meta={(PCATS[p.category] || PCATS.other).label} amount={fmtEur(p.amount || 0)} onRemove={() => removeFrom("personalBudgets", p.id)} />
                ))}
                <QuickAdd onAdd={() => { if (!pers.name || !pers.amount) return; pushTo("personalBudgets", { ...pers, id: uid("p") }); setPers({ name: "", category: "groceries", amount: "" }); }} canAdd={!!pers.name && !!pers.amount}>
                  <TextInput value={pers.name} onChange={(v) => setPers({ ...pers, name: v })} placeholder="e.g. Going out" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Select value={pers.category} onChange={(v) => setPers({ ...pers, category: v })}
                      options={Object.entries(PCATS).map(([value, c]) => ({ value, label: c.label }))} />
                    <MoneyInput value={pers.amount} onChange={(v) => setPers({ ...pers, amount: v })} />
                  </div>
                </QuickAdd>
              </div>
            )}

            {meta.key === "done" && <OnbDone draft={draft} />}
          </div>

          {/* footer */}
          <div style={{ flex: "0 0 auto", padding: "12px 18px calc(16px + env(safe-area-inset-bottom))", borderTop: "1px solid var(--line)", display: "flex", gap: 10 }}>
            {meta.key === "done"
              ? <Btn variant="primary" icon="check" onClick={() => onFinish(draft)} style={{ flex: 1, justifyContent: "center", padding: "13px" }}>Enter Allot</Btn>
              : <Btn variant="primary" onClick={next} style={{ flex: 1, justifyContent: "center", padding: "13px" }}>{stepCount(step)} · Continue</Btn>}
          </div>
        </>
      )}
    </div>
  );
}

function stepCount(step) { return "Step " + step + " of " + ONB_INPUT_STEPS; }
function onbNextYear() { const d = new Date(NOW); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); }

const onbGhost = { width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--text-2)" };
const onbDate = { width: "100%", marginTop: 10, background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text)", borderRadius: "var(--r-sm)", padding: "11px 14px", fontSize: 14.5, outline: "none", colorScheme: "dark" };

function Welcome({ onStart, onSample }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 26px calc(28px + env(safe-area-inset-bottom))", textAlign: "center" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 22 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--accent)", display: "grid", placeItems: "center", color: "#06160c", fontWeight: 700, transform: "rotate(45deg)", boxShadow: "0 16px 40px -8px color-mix(in oklch, var(--accent) 50%, transparent)" }}>
          <span style={{ transform: "rotate(-45deg)", fontSize: 30 }}>A</span>
        </div>
        <div>
          <h1 style={{ fontSize: 30, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Let's build your<br />budget plan</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-2)", marginTop: 14, lineHeight: 1.55, maxWidth: 320 }}>
            Tell Allot what comes in and what goes out. It splits every euro across your bills, debts and goals — and pays the rest to you.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300, marginTop: 6 }}>
          {[["coins", "Income"], ["cart", "Expenses"], ["target", "Goals"], ["wallet", "Personal money"]].map(([ic, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, textAlign: "left" }}>
              <Icon name={ic} size={18} stroke="var(--accent)" />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn variant="primary" onClick={onStart} style={{ justifyContent: "center", padding: "14px", fontSize: 15 }}>Get started</Btn>
        <button onClick={onSample} style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 13, padding: 6 }}>or explore with sample data</button>
      </div>
    </div>
  );
}

function OnbDone({ draft }) {
  const b = computeBudget(draft);
  const rows = [
    { label: "Monthly income", v: b.incomeTotal, color: "var(--accent)" },
    { label: "Fixed expenses", v: b.expensesTotal },
    { label: "Debt payments", v: b.debtTotal },
    { label: "Into savings", v: b.savingsTotal, color: "oklch(0.78 0.13 200)" },
    { label: "Personal budgets", v: b.personalBudgetsTotal },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 8 }}>
      <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: "color-mix(in oklch, var(--accent) 18%, transparent)", color: "var(--accent)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
          <Icon name="check" size={28} />
        </div>
        <h2 style={{ fontSize: 23, letterSpacing: "-0.02em" }}>You're all set</h2>
        <p style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 6 }}>Here's your starting plan. You can change anything later.</p>
      </div>
      <Card style={{ padding: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Paid to your personal account</div>
        <div className="num" style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em", color: b.paidToPersonal < 0 ? "var(--rose)" : "var(--accent)" }}>{fmtEur(b.paidToPersonal)}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 16 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
              <span style={{ color: "var(--text-2)" }}>{r.label}</span>
              <span className="num mono" style={{ color: r.color || "var(--text)" }}>{fmtEur(r.v)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---- shared bits ----
function QuickAdd({ children, onAdd, canAdd, addLabel = "Add" }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px dashed var(--line)", borderRadius: "var(--r)", padding: 14, display: "flex", flexDirection: "column", gap: 11 }}>
      {children}
      <Btn variant="ghost" icon="plus" onClick={onAdd} disabled={!canAdd} style={{ justifyContent: "center", opacity: canAdd ? 1 : 0.5 }}>{addLabel}</Btn>
    </div>
  );
}

function OnbRow({ icon, color, catKey, cats, title, meta, amount, onRemove }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
      {catKey
        ? <CatDot category={catKey} cats={cats} size={34} />
        : <div style={{ width: 34, height: 34, borderRadius: 9, background: `color-mix(in oklch, ${color} 16%, transparent)`, color, display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={icon} size={17} /></div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{meta}</div>
      </div>
      <span className="num mono" style={{ fontSize: 14 }}>{amount}</span>
      <button onClick={onRemove} style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "transparent", border: "1px solid var(--line)", color: "var(--text-3)", flex: "0 0 auto" }}><Icon name="trash" size={14} /></button>
    </div>
  );
}

Object.assign(window, { Onboarding });
