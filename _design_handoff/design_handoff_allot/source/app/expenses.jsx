// expenses.jsx — fixed expenses: categorize + set payday.
const { useState: useStateExp } = React;

function Expenses({ state, b, update }) {
  const [edit, setEdit] = useStateExp(null);
  const [sort, setSort] = useStateExp("payday"); // payday | amount | category

  function save(item) {
    if (item.id) update((s) => ({ ...s, expenses: s.expenses.map((e) => (e.id === item.id ? item : e)) }));
    else update((s) => ({ ...s, expenses: [...s.expenses, { ...item, id: "e" + Date.now() }] }));
    setEdit(null);
  }
  function del(id) { update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) })); }
  function addCat(cat) { update((s) => ({ ...s, customCats: [...(s.customCats || []), cat] })); }
  const cats = b.cats;

  const list = [...state.expenses].sort((a, c) => {
    if (sort === "amount") return c.amount - a.amount;
    if (sort === "category") return a.category.localeCompare(c.category);
    return a.payday - c.payday;
  });

  return (
    <div className="fadeup" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHead title="Expenses" sub="Recurring costs paid from your main account."
        action={<Btn variant="primary" icon="plus" onClick={() => setEdit({ name: "", category: "housing", amount: "", payday: 1 })}>Add expense</Btn>} />

      <StatRow items={[
        { label: "Monthly total", value: fmtEur(b.expensesTotal), color: "var(--blue)" },
        { label: "Share of income", value: Math.round(b.expensesTotal / Math.max(1, b.incomeTotal) * 100) + "%" },
        { label: "Items", value: state.expenses.length, sub: Object.keys(b.expByCat).length + " categories" },
      ]} />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 16 }}>All expenses</h3>
          <Segmented size="sm" value={sort}
            options={[{ value: "payday", label: "By payday" }, { value: "amount", label: "By amount" }, { value: "category", label: "By category" }]}
            onChange={setSort} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--line-2)", borderRadius: "var(--r)", overflow: "hidden", border: "1px solid var(--line)" }}>
          {list.length === 0 && <Empty label="No expenses yet." />}
          {list.map((e) => {
            const cat = cats[e.category] || cats.other;
            return (
              <div key={e.id} style={{ background: "var(--surface)", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                <CatDot category={e.category} cats={cats} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.label} · {ordinal(e.payday)}</div>
                </div>
                <div className="num mono" style={{ fontSize: 15, textAlign: "right", flex: "0 0 auto" }}>{fmtEur(e.amount || 0)}</div>
                <div style={{ display: "flex", gap: 4, flex: "0 0 auto" }}>
                  <IconBtn name="card" onClick={() => setEdit(e)} title="Edit" />
                  <IconBtn name="trash" onClick={() => del(e.id)} title="Delete" danger />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* payday timeline */}
      <Card>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Payment calendar</h3>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 18 }}>When each expense leaves your account through the month.</div>
        <PaydayTimeline expenses={state.expenses} cats={cats} />
      </Card>

      <ExpenseSheet item={edit} cats={cats} onAddCat={addCat} onClose={() => setEdit(null)} onSave={save} />
    </div>
  );
}

function PaydayTimeline({ expenses, cats }) {
  const map = cats || {};
  const byDay = {};
  expenses.forEach((e) => { (byDay[e.payday] = byDay[e.payday] || []).push(e); });
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);
  const maxDay = 31;
  return (
    <div>
      <div style={{ position: "relative", height: 2, background: "var(--line)", borderRadius: 2, margin: "30px 6px 0" }}>
        {days.map((d) => {
          const total = byDay[d].reduce((s, e) => s + (e.amount || 0), 0);
          const left = ((d - 1) / (maxDay - 1)) * 100;
          return (
            <div key={d} style={{ position: "absolute", left: left + "%", top: 0, transform: "translateX(-50%)" }}>
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", textAlign: "center" }}>
                <div className="num mono" style={{ fontSize: 12, color: "var(--text)" }}>{fmtEur(total)}</div>
                <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 4 }}>
                  {byDay[d].map((e) => <span key={e.id} title={e.name} style={{ width: 7, height: 7, borderRadius: 2, background: (map[e.category] || {}).color || "var(--text-3)" }} />)}
                </div>
              </div>
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--surface)", border: "2px solid var(--text-2)", transform: "translateY(-5px)" }} />
              <div className="mono" style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "var(--text-3)" }}>{ordinal(d)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 34 }} />
    </div>
  );
}

function ExpenseSheet({ item, cats, onAddCat, onClose, onSave }) {
  const [d, setD] = useStateExp(item);
  const [mk, setMk] = useStateExp(null); // custom-category draft, or null
  React.useEffect(() => { setD(item); setMk(null); }, [item]);
  if (!d) return null;
  const set = (k, v) => setD({ ...d, [k]: v });
  const catMap = cats || (typeof CATEGORIES !== "undefined" ? CATEGORIES : {});

  function createCat() {
    if (!mk.label.trim()) return;
    const id = "c" + Date.now();
    onAddCat({ id, label: mk.label.trim(), color: mk.color, icon: mk.icon });
    set("category", id);
    setMk(null);
  }

  return (
    <Sheet open={!!item} onClose={onClose} title={item && item.id ? "Edit expense" : "Add expense"}
      footer={<>
        <Btn variant="dim" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="check" onClick={() => onSave(d)} disabled={!d.name || !d.amount}>Save</Btn>
      </>}>
      <Field label="Name"><TextInput value={d.name} onChange={(v) => set("name", v)} placeholder="e.g. Apartment rent" /></Field>
      <Field label="Category">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {Object.entries(catMap).map(([k, c]) => {
            const on = d.category === k;
            return (
              <button key={k} onClick={() => { set("category", k); setMk(null); }} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "11px 4px",
                borderRadius: 12, cursor: "pointer", background: on ? `color-mix(in oklch, ${c.color} 16%, transparent)` : "var(--bg-2)",
                border: `1px solid ${on ? c.color : "var(--line)"}`, color: on ? c.color : "var(--text-2)", transition: "all .14s ease",
              }}>
                <Icon name={c.icon} size={18} />
                <span style={{ fontSize: 10.5, fontWeight: 500, lineHeight: 1.1, textAlign: "center" }}>{c.label.split(" / ")[0]}</span>
              </button>
            );
          })}
          <button onClick={() => setMk(mk ? null : { label: "", color: CAT_COLORS[0], icon: "cart" })} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 4px",
            borderRadius: 12, cursor: "pointer", background: "var(--bg-2)",
            border: `1px dashed ${mk ? "var(--accent)" : "var(--line)"}`, color: mk ? "var(--accent)" : "var(--text-3)", transition: "all .14s ease",
          }}>
            <Icon name="plus" size={18} />
            <span style={{ fontSize: 10.5, fontWeight: 500, lineHeight: 1.1 }}>New</span>
          </button>
        </div>
      </Field>

      {mk && (
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: 16, marginTop: -4, marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>New category</div>
          <TextInput value={mk.label} onChange={(v) => setMk({ ...mk, label: v })} placeholder="Category name" style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {CAT_COLORS.map((col) => (
              <button key={col} onClick={() => setMk({ ...mk, color: col })} title="color" style={{
                width: 28, height: 28, borderRadius: 8, background: col, cursor: "pointer",
                border: mk.color === col ? "2px solid var(--text)" : "2px solid transparent", outline: mk.color === col ? "1px solid var(--text)" : "none",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
            {CAT_ICONS.map((ic) => {
              const on = mk.icon === ic;
              return (
                <button key={ic} onClick={() => setMk({ ...mk, icon: ic })} style={{
                  width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", cursor: "pointer",
                  background: on ? `color-mix(in oklch, ${mk.color} 18%, transparent)` : "var(--surface)",
                  border: `1px solid ${on ? mk.color : "var(--line)"}`, color: on ? mk.color : "var(--text-2)",
                }}><Icon name={ic} size={17} /></button>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="dim" size="sm" onClick={() => setMk(null)}>Cancel</Btn>
            <Btn variant="primary" size="sm" icon="check" onClick={createCat} disabled={!mk.label.trim()}>Create category</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Amount / month"><MoneyInput value={d.amount} onChange={(v) => set("amount", v)} /></Field>
        <Field label="Payday" hint="Day of the month it's due">
          <Select value={String(d.payday)} onChange={(v) => set("payday", Number(v))}
            options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: ordinal(i + 1) }))} />
        </Field>
      </div>
    </Sheet>
  );
}

Object.assign(window, { Expenses });
