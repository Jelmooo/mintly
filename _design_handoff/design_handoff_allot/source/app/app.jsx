// app.jsx — phone-first shell: status bar, header, scroll, bottom tabs, onboarding, Tweaks.
const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

const NAV = [
  { id: "overview", label: "Home",     icon: "pie" },
  { id: "income",   label: "Income",   icon: "coins" },
  { id: "expenses", label: "Expenses", icon: "cart" },
  { id: "debt",     label: "Debt",     icon: "card" },
  { id: "goals",    label: "Goals",    icon: "target" },
  { id: "personal", label: "Personal", icon: "user" },
];

const ACCENTS = {
  mint:   "oklch(0.82 0.15 155)",
  blue:   "oklch(0.80 0.13 250)",
  violet: "oklch(0.78 0.14 305)",
  amber:  "oklch(0.83 0.14 75)",
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "mint",
  "density": "regular",
  "showCadenceInNav": true
}/*EDITMODE-END*/;

const ONB_KEY = "allot.onboarded.v1";

function usePersistentState() {
  const KEY = "allot.budget.v2";
  const [state, setState] = useS(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return SAMPLE;
  });
  useE(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }, [state]);
  const update = (fn) => setState((s) => (typeof fn === "function" ? fn(s) : fn));
  const reset = () => setState(SAMPLE);
  return [state, update, reset, setState];
}

function fmtClock() {
  const d = new Date();
  return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
}

function StatusBar() {
  const [now, setNow] = useS(fmtClock);
  useE(() => { const id = setInterval(() => setNow(fmtClock()), 15000); return () => clearInterval(id); }, []);
  return (
    <div className="app-status">
      <span className="num">{now}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-2)" }}>
        <Icon name="wifi" size={15} />
        <span style={{ display: "inline-block", width: 24, height: 12, border: "1.5px solid var(--text-2)", borderRadius: 3, position: "relative" }}>
          <span style={{ position: "absolute", top: 1.5, left: 1.5, bottom: 1.5, width: "65%", background: "var(--text-2)", borderRadius: 1 }} />
        </span>
      </span>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [state, update, reset] = usePersistentState();
  const [tab, setTab] = useS(() => location.hash.replace("#", "") || "overview");
  const [onb, setOnb] = useS(() => !localStorage.getItem(ONB_KEY));
  const scrollRef = useR(null);

  useE(() => {
    document.documentElement.style.setProperty("--accent", ACCENTS[t.accent] || ACCENTS.mint);
    document.documentElement.setAttribute("data-density", t.density);
  }, [t.accent, t.density]);

  useE(() => {
    function onHash() { const h = location.hash.replace("#", ""); if (h) setTab(h); }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  function go(id) {
    setTab(id); location.hash = id;
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finishOnb() { try { localStorage.setItem(ONB_KEY, "1"); } catch (e) {} setOnb(false); go("overview"); }
  function replayOnb() { try { localStorage.removeItem(ONB_KEY); } catch (e) {} setOnb(true); }

  const b = useM(() => computeBudget(state), [state]);

  const screens = {
    overview: <Overview state={state} b={b} onNav={go} />,
    income:   <Income state={state} b={b} update={update} />,
    expenses: <Expenses state={state} b={b} update={update} />,
    debt:     <Debt state={state} b={b} update={update} />,
    goals:    <Goals state={state} b={b} update={update} />,
    personal: <Personal state={state} b={b} update={update} onNav={go} />,
  };

  return (
    <div className="device-bg">
      <div className="phone">
        <StatusBar />

        {/* header */}
        <header className="app-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "grid", placeItems: "center", color: "#06160c", fontWeight: 700, transform: "rotate(45deg)" }}>
              <span style={{ transform: "rotate(-45deg)", fontSize: 15 }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>Allot</div>
              <div className="eyebrow" style={{ fontSize: 8.5, marginTop: 2 }}>budget allocator</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {t.showCadenceInNav && <Pill color="var(--text-2)">{CADENCE[state.salary.cadence].label}</Pill>}
            <button onClick={replayOnb} title="Re-run setup" style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--text-2)" }}>
              <Icon name="flag" size={16} />
            </button>
          </div>
        </header>

        {/* scrollable content */}
        <div className="app-scroll" ref={scrollRef}>
          {screens[tab] || screens.overview}
        </div>

        {/* bottom tabs */}
        <nav className="app-tabs">
          {NAV.map((n) => {
            const on = tab === n.id;
            return (
              <button key={n.id} onClick={() => go(n.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1,
                background: "none", border: "none", color: on ? "var(--accent)" : "var(--text-3)", padding: "6px 1px",
              }}>
                <Icon name={n.icon} size={20} stroke="currentColor" />
                <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "-0.01em" }}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        {/* onboarding overlay */}
        {onb && <Onboarding onFinish={(draft) => { update(draft); finishOnb(); }}
          onSample={() => { reset(); finishOnb(); }}
          onSkip={finishOnb} />}

        {/* Tweaks */}
        <TweaksPanel>
          <TweakSection label="Theme" />
          <TweakColor label="Accent" value={t.accent === "mint" ? ACCENTS.mint : ACCENTS[t.accent]}
            options={[ACCENTS.mint, ACCENTS.blue, ACCENTS.violet, ACCENTS.amber]}
            onChange={(v) => setTweak("accent", Object.keys(ACCENTS).find((k) => ACCENTS[k] === v) || "mint")} />
          <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
          <TweakSection label="Chrome" />
          <TweakToggle label="Show cadence in header" value={t.showCadenceInNav} onChange={(v) => setTweak("showCadenceInNav", v)} />
          <TweakSection label="Data" />
          <TweakButton label="Re-run onboarding" onClick={replayOnb} />
          <TweakButton label="Reset to sample" onClick={reset} />
        </TweaksPanel>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
