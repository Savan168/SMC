import { useState, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const TIMEFRAMES = ["M15", "M30", "H1", "H4", "D1"];

const DEFAULT_TF_STATE = {
  bias:    "neutral", // "bullish" | "bearish" | "neutral"
  adm:     "none",    // "accumulation" | "manipulation" | "distribution" | "none"
  swept:   false,
  sweepDir:"none",    // "bsl" | "ssl" | "none"
  choch:   false,
  chochDir:"none",    // "bull" | "bear" | "none"
  pdArray: "none",    // "fvg" | "ob" | "ifvg" | "none"
  signal:  "none",   // "long" | "short" | "none"
};

const BIAS_OPTIONS    = ["bullish", "bearish", "neutral"];
const ADM_OPTIONS     = ["accumulation", "manipulation", "distribution", "none"];
const SWEEP_OPTIONS   = ["bsl", "ssl", "none"];
const CHOCH_OPTIONS   = ["bull", "bear", "none"];
const PD_OPTIONS      = ["fvg", "ob", "ifvg", "none"];
const SIGNAL_OPTIONS  = ["long", "short", "none"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const col = {
  bull:    "#00c48c",
  bear:    "#ff4d6d",
  neutral: "#8a8a9e",
  sweep:   "#f5a623",
  choch:   "#b06de0",
  bg:      "#0d1117",
  surface: "#161b22",
  surface2:"#1c2128",
  border:  "#30363d",
  accent:  "#58a6ff",
  text:    "#e6edf3",
  muted:   "#8b949e",
};

function biasColor(b) {
  if (b === "bullish") return col.bull;
  if (b === "bearish") return col.bear;
  return col.neutral;
}

function admColor(a) {
  if (a === "accumulation")  return col.accent;
  if (a === "manipulation")  return col.sweep;
  if (a === "distribution")  return col.bull;
  return col.neutral;
}

function admEmoji(a) {
  if (a === "accumulation")  return "🔄";
  if (a === "manipulation")  return "⚡";
  if (a === "distribution")  return "📦";
  return "─";
}

function signalColor(s) {
  if (s === "long")  return col.bull;
  if (s === "short") return col.bear;
  return col.neutral;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "─";
}

// Validate entry setup: needs sweep → choch → pd array aligned
function validateSetup(tf) {
  const bullOk = tf.swept && tf.sweepDir === "ssl" && tf.choch && tf.chochDir === "bull";
  const bearOk = tf.swept && tf.sweepDir === "bsl" && tf.choch && tf.chochDir === "bear";
  if (bullOk && tf.pdArray !== "none") return { valid: true, dir: "long",  score: 3 };
  if (bullOk)                          return { valid: true, dir: "long",  score: 2 };
  if (bearOk && tf.pdArray !== "none") return { valid: true, dir: "short", score: 3 };
  if (bearOk)                          return { valid: true, dir: "short", score: 2 };
  return { valid: false, dir: "none", score: 0 };
}

// ─── COMPONENT: Pill Select ───────────────────────────────────────────────────
function PillSelect({ options, value, onChange, colorFn }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
      {options.map(o => {
        const active = o === value;
        const c = colorFn ? colorFn(o) : col.accent;
        return (
          <button key={o} onClick={() => onChange(o)}
            style={{
              padding:"2px 10px", borderRadius:12, fontSize:11, cursor:"pointer",
              border: active ? `1px solid ${c}` : `1px solid ${col.border}`,
              background: active ? `${c}22` : "transparent",
              color: active ? c : col.muted,
              transition:"all .15s",
            }}>{capitalize(o)}</button>
        );
      })}
    </div>
  );
}

// ─── COMPONENT: TF Row ───────────────────────────────────────────────────────
function TFRow({ tf, data, onChange }) {
  const setup = validateSetup(data);

  function set(key, val) {
    onChange(tf, { ...data, [key]: val });
  }

  return (
    <div style={{
      background: col.surface, borderRadius:10, padding:"12px 14px", marginBottom:8,
      border:`1px solid ${col.border}`,
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
        <span style={{
          background:`${biasColor(data.bias)}22`,
          color: biasColor(data.bias),
          border:`1px solid ${biasColor(data.bias)}44`,
          borderRadius:6, padding:"1px 10px", fontWeight:700, fontSize:13,
        }}>{tf}</span>
        <span style={{
          color: biasColor(data.bias), fontSize:12, fontWeight:600,
        }}>{data.bias === "bullish" ? "▲ Bullish" : data.bias === "bearish" ? "▼ Bearish" : "─ Neutral"}</span>
        {setup.valid && (
          <span style={{
            marginLeft:"auto", fontSize:11, fontWeight:700,
            color: signalColor(setup.dir),
            background:`${signalColor(setup.dir)}22`,
            border:`1px solid ${signalColor(setup.dir)}44`,
            borderRadius:6, padding:"1px 8px",
          }}>
            {setup.dir === "long" ? "✅ LONG SETUP" : "✅ SHORT SETUP"}
            {setup.score === 3 ? " +PD" : ""}
          </span>
        )}
      </div>

      {/* Grid */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px 12px",
      }}>
        {/* Bias */}
        <div>
          <div style={{ color:col.muted, fontSize:10, marginBottom:3 }}>BIAS</div>
          <PillSelect options={BIAS_OPTIONS} value={data.bias} onChange={v => set("bias",v)}
            colorFn={b => b==="bullish"?col.bull:b==="bearish"?col.bear:col.neutral} />
        </div>
        {/* ADM */}
        <div>
          <div style={{ color:col.muted, fontSize:10, marginBottom:3 }}>ADM PHASE</div>
          <PillSelect options={ADM_OPTIONS} value={data.adm} onChange={v => set("adm",v)}
            colorFn={admColor} />
        </div>
        {/* Sweep */}
        <div>
          <div style={{ color:col.muted, fontSize:10, marginBottom:3 }}>SWEEP</div>
          <PillSelect options={SWEEP_OPTIONS} value={data.sweepDir}
            onChange={v => set("sweepDir", v) || set("swept", v !== "none")}
            colorFn={v => v==="ssl"?col.bull:v==="bsl"?col.bear:col.neutral} />
        </div>
        {/* CHoCH */}
        <div>
          <div style={{ color:col.muted, fontSize:10, marginBottom:3 }}>CHoCH / MSS</div>
          <PillSelect options={CHOCH_OPTIONS} value={data.chochDir}
            onChange={v => { set("chochDir", v); set("choch", v !== "none"); }}
            colorFn={v => v==="bull"?col.bull:v==="bear"?col.bear:col.neutral} />
        </div>
        {/* PD Array */}
        <div>
          <div style={{ color:col.muted, fontSize:10, marginBottom:3 }}>PD ARRAY</div>
          <PillSelect options={PD_OPTIONS} value={data.pdArray} onChange={v => set("pdArray",v)}
            colorFn={v => v!=="none"?col.choch:col.neutral} />
        </div>
        {/* Signal override */}
        <div>
          <div style={{ color:col.muted, fontSize:10, marginBottom:3 }}>SIGNAL</div>
          <PillSelect options={SIGNAL_OPTIONS} value={data.signal} onChange={v => set("signal",v)}
            colorFn={signalColor} />
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT: AI Analysis Panel ────────────────────────────────────────────
function AIPanel({ tfData, apiKey, onApiKeyChange }) {
  const [analysis, setAnalysis]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [showKey, setShowKey]     = useState(false);

  const analyze = useCallback(async () => {
    if (!apiKey) { setError("Please enter your Claude API key."); return; }
    setLoading(true);
    setError(null);
    setAnalysis(null);

    // Build prompt from current TF data
    const summary = TIMEFRAMES.map(tf => {
      const d = tfData[tf];
      const setup = validateSetup(d);
      return `${tf}: bias=${d.bias}, adm=${d.adm}, sweep=${d.sweepDir||"none"}, choch=${d.chochDir||"none"}, pdArray=${d.pdArray}, validSetup=${setup.valid}(${setup.dir})`;
    }).join("\n");

    const prompt = `You are an expert SMC (Smart Money Concepts) trading analyst using the JordyBanks methodology.

Analyze the following multi-timeframe data and provide a concise assessment:

${summary}

ADM framework: Accumulation (consolidation range) → Manipulation (liquidity sweep / stop hunt) → Distribution (impulse move).
Valid entry requires: Liquidity Sweep → CHoCH/MSS confirmation → Price return to PD Array (FVG/OB/IFVG).

Please respond in this exact JSON format only, no markdown:
{
  "overallBias": "bullish|bearish|neutral",
  "confidence": 0-100,
  "bestTF": "M15|M30|H1|H4|D1",
  "entryDir": "long|short|wait",
  "setupQuality": "A|B|C|invalid",
  "confluence": ["list","of","confluences","found"],
  "warnings": ["list","of","concerns"],
  "summary": "2-3 sentence plain English summary of what is happening and what to watch for"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAnalysis(parsed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, tfData]);

  const gradeColor = g => g==="A"?col.bull:g==="B"?col.sweep:g==="C"?col.muted:col.bear;

  return (
    <div style={{
      background: col.surface, borderRadius:12, padding:16,
      border:`1px solid ${col.accent}44`,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <span style={{ fontSize:18 }}>🤖</span>
        <span style={{ color:col.accent, fontWeight:700, fontSize:14 }}>Claude AI Analysis</span>
        <span style={{ marginLeft:"auto", color:col.muted, fontSize:10 }}>claude-sonnet-4-6</span>
      </div>

      {/* API Key */}
      <div style={{ marginBottom:10 }}>
        <div style={{ color:col.muted, fontSize:10, marginBottom:4 }}>ANTHROPIC API KEY</div>
        <div style={{ display:"flex", gap:6 }}>
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={e => onApiKeyChange(e.target.value)}
            placeholder="sk-ant-..."
            style={{
              flex:1, background:col.surface2, border:`1px solid ${col.border}`,
              borderRadius:6, padding:"6px 10px", color:col.text, fontSize:12,
              outline:"none",
            }}
          />
          <button onClick={() => setShowKey(s=>!s)}
            style={{
              background:col.surface2, border:`1px solid ${col.border}`,
              borderRadius:6, padding:"6px 8px", color:col.muted, cursor:"pointer", fontSize:11,
            }}>{showKey ? "🙈" : "👁"}</button>
        </div>
      </div>

      <button onClick={analyze} disabled={loading}
        style={{
          width:"100%", padding:"8px 0", borderRadius:8, border:"none",
          background: loading ? col.border : col.accent,
          color: loading ? col.muted : "#0d1117",
          fontWeight:700, fontSize:13, cursor: loading ? "default" : "pointer",
          transition:"all .2s",
        }}>
        {loading ? "⏳ Analyzing..." : "⚡ Analyze Setup"}
      </button>

      {error && (
        <div style={{
          marginTop:10, padding:"8px 12px", background:`${col.bear}18`,
          border:`1px solid ${col.bear}44`, borderRadius:6,
          color:col.bear, fontSize:12,
        }}>{error}</div>
      )}

      {analysis && (
        <div style={{ marginTop:14 }}>
          {/* Top row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
            {[
              { label:"OVERALL BIAS", val: analysis.overallBias?.toUpperCase(), c: biasColor(analysis.overallBias) },
              { label:"DIRECTION",    val: analysis.entryDir?.toUpperCase(),     c: signalColor(analysis.entryDir)   },
              { label:"CONFIDENCE",   val: `${analysis.confidence}%`,            c: analysis.confidence >= 70 ? col.bull : analysis.confidence >= 40 ? col.sweep : col.bear },
            ].map(({label,val,c}) => (
              <div key={label} style={{
                background:col.surface2, borderRadius:8, padding:"8px 10px",
                border:`1px solid ${col.border}`, textAlign:"center",
              }}>
                <div style={{ color:col.muted, fontSize:9, marginBottom:3 }}>{label}</div>
                <div style={{ color:c, fontWeight:700, fontSize:13 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Setup quality + best TF */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div style={{
              background:col.surface2, borderRadius:8, padding:"8px 10px",
              border:`1px solid ${col.border}`, textAlign:"center",
            }}>
              <div style={{ color:col.muted, fontSize:9, marginBottom:3 }}>SETUP GRADE</div>
              <div style={{ color:gradeColor(analysis.setupQuality), fontWeight:800, fontSize:20 }}>
                {analysis.setupQuality}
              </div>
            </div>
            <div style={{
              background:col.surface2, borderRadius:8, padding:"8px 10px",
              border:`1px solid ${col.border}`, textAlign:"center",
            }}>
              <div style={{ color:col.muted, fontSize:9, marginBottom:3 }}>BEST TIMEFRAME</div>
              <div style={{ color:col.accent, fontWeight:700, fontSize:16 }}>{analysis.bestTF}</div>
            </div>
          </div>

          {/* Confluence */}
          {analysis.confluence?.length > 0 && (
            <div style={{ marginBottom:8 }}>
              <div style={{ color:col.muted, fontSize:10, marginBottom:4 }}>✅ CONFLUENCE</div>
              {analysis.confluence.map((c,i) => (
                <div key={i} style={{
                  fontSize:11, color:col.bull, padding:"2px 0",
                  borderBottom:`1px solid ${col.border}22`,
                }}>• {c}</div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {analysis.warnings?.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ color:col.muted, fontSize:10, marginBottom:4 }}>⚠️ WARNINGS</div>
              {analysis.warnings.map((w,i) => (
                <div key={i} style={{ fontSize:11, color:col.sweep, padding:"2px 0" }}>• {w}</div>
              ))}
            </div>
          )}

          {/* Summary */}
          {analysis.summary && (
            <div style={{
              background:`${col.accent}11`, border:`1px solid ${col.accent}22`,
              borderRadius:8, padding:"10px 12px",
            }}>
              <div style={{ color:col.muted, fontSize:10, marginBottom:4 }}>📋 SUMMARY</div>
              <div style={{ color:col.text, fontSize:12, lineHeight:1.6 }}>{analysis.summary}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── COMPONENT: TF Overview Bar ──────────────────────────────────────────────
function TFOverviewBar({ tfData }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:`repeat(${TIMEFRAMES.length},1fr)`,
      gap:6, marginBottom:16,
    }}>
      {TIMEFRAMES.map(tf => {
        const d = tfData[tf];
        const setup = validateSetup(d);
        const bc = biasColor(d.bias);
        return (
          <div key={tf} style={{
            background: col.surface, borderRadius:8, padding:"8px 6px",
            border: setup.valid ? `1px solid ${signalColor(setup.dir)}66` : `1px solid ${col.border}`,
            textAlign:"center",
          }}>
            <div style={{ color:col.muted, fontSize:9, marginBottom:3 }}>{tf}</div>
            <div style={{ fontSize:14, marginBottom:2 }}>
              {d.bias==="bullish"?"▲":d.bias==="bearish"?"▼":"─"}
            </div>
            <div style={{ color:bc, fontSize:9, fontWeight:600 }}>
              {d.bias==="neutral"?"NEUTRAL":d.bias.toUpperCase()}
            </div>
            {d.adm !== "none" && (
              <div style={{ fontSize:12, marginTop:2 }}>{admEmoji(d.adm)}</div>
            )}
            {d.swept && d.sweepDir !== "none" && (
              <div style={{ color:col.sweep, fontSize:9, marginTop:1 }}>⚡ SWEPT</div>
            )}
            {setup.valid && (
              <div style={{
                marginTop:3, fontSize:8, fontWeight:700,
                color:signalColor(setup.dir),
                background:`${signalColor(setup.dir)}22`,
                borderRadius:4, padding:"1px 4px",
              }}>{setup.dir.toUpperCase()}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function SMCDashboard() {
  // TF state
  const initTF = () => Object.fromEntries(TIMEFRAMES.map(tf => [tf, { ...DEFAULT_TF_STATE }]));
  const [tfData, setTfData] = useState(initTF);
  const [apiKey, setApiKey] = useState("");
  const [activeTF, setActiveTF] = useState(null);   // null = show all

  function handleTFChange(tf, newData) {
    // Auto-derive signal from sweep+choch
    const setup = validateSetup(newData);
    if (setup.valid) newData.signal = setup.dir;
    setTfData(prev => ({ ...prev, [tf]: newData }));
  }

  function resetAll() {
    setTfData(initTF());
  }

  // Count valid setups
  const validSetups = TIMEFRAMES.filter(tf => validateSetup(tfData[tf]).valid);

  return (
    <div style={{
      background: col.bg, minHeight:"100vh", fontFamily:"'SF Mono','Fira Code',monospace",
      color:col.text, padding:"0 0 40px",
    }}>
      {/* Header */}
      <div style={{
        background:`linear-gradient(135deg,${col.surface} 0%,${col.surface2} 100%)`,
        borderBottom:`1px solid ${col.border}`, padding:"14px 20px",
        display:"flex", alignItems:"center", gap:12,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:col.text, letterSpacing:1 }}>
            SMC · ADM <span style={{ color:col.accent }}>PRO</span>
          </div>
          <div style={{ fontSize:10, color:col.muted, letterSpacing:2 }}>
            SMART MONEY CONCEPTS · ACCUMULATION · DISTRIBUTION · MANIPULATION
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          {validSetups.length > 0 && (
            <div style={{
              background:`${col.bull}22`, border:`1px solid ${col.bull}44`,
              borderRadius:6, padding:"3px 10px", color:col.bull, fontSize:11, fontWeight:700,
            }}>
              {validSetups.length} SETUP{validSetups.length>1?"S":""} VALID
            </div>
          )}
          <button onClick={resetAll}
            style={{
              background:"transparent", border:`1px solid ${col.border}`,
              borderRadius:6, padding:"4px 12px", color:col.muted,
              cursor:"pointer", fontSize:11,
            }}>Reset</button>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"16px 16px 0" }}>

        {/* Overview bar */}
        <TFOverviewBar tfData={tfData} />

        <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16 }}>

          {/* Left: TF inputs */}
          <div>
            <div style={{
              display:"flex", gap:6, marginBottom:10, alignItems:"center",
            }}>
              <span style={{ color:col.muted, fontSize:10, marginRight:4 }}>FILTER:</span>
              {[null, ...TIMEFRAMES].map(tf => (
                <button key={tf ?? "all"} onClick={() => setActiveTF(tf)}
                  style={{
                    padding:"3px 10px", borderRadius:6, fontSize:11, cursor:"pointer",
                    border: activeTF===tf ? `1px solid ${col.accent}` : `1px solid ${col.border}`,
                    background: activeTF===tf ? `${col.accent}22` : "transparent",
                    color: activeTF===tf ? col.accent : col.muted,
                  }}>{tf ?? "All"}</button>
              ))}
            </div>

            {TIMEFRAMES.filter(tf => activeTF === null || activeTF === tf).map(tf => (
              <TFRow key={tf} tf={tf} data={tfData[tf]} onChange={handleTFChange} />
            ))}

            {/* Legend */}
            <div style={{
              background:col.surface, borderRadius:8, padding:"10px 14px",
              border:`1px solid ${col.border}`, marginTop:4,
            }}>
              <div style={{ color:col.muted, fontSize:10, marginBottom:6 }}>VALID ENTRY LOGIC</div>
              <div style={{ fontSize:11, color:col.text, lineHeight:1.9 }}>
                <span style={{ color:col.sweep }}>⚡ Sweep</span> →{" "}
                <span style={{ color:col.choch }}>CHoCH / MSS</span> →{" "}
                <span style={{ color:col.choch }}>Return to PD Array</span>{" "}
                <span style={{ color:col.bull }}>(FVG / OB / IFVG)</span>
                <br/>
                <span style={{ color:col.muted, fontSize:10 }}>
                  SSL Sweep → Bull CHoCH → Demand OB/FVG = 
                </span>
                <span style={{ color:col.bull, fontSize:10 }}> ✅ LONG</span>
                {"   "}
                <span style={{ color:col.muted, fontSize:10 }}>
                  BSL Sweep → Bear CHoCH → Supply OB/FVG = 
                </span>
                <span style={{ color:col.bear, fontSize:10 }}> ✅ SHORT</span>
              </div>
            </div>
          </div>

          {/* Right: AI panel */}
          <div>
            <AIPanel tfData={tfData} apiKey={apiKey} onApiKeyChange={setApiKey} />

            {/* Quick ref */}
            <div style={{
              marginTop:12, background:col.surface, borderRadius:10,
              padding:"12px 14px", border:`1px solid ${col.border}`,
            }}>
              <div style={{ color:col.muted, fontSize:10, marginBottom:8 }}>📖 ADM CHEAT SHEET</div>
              {[
                { phase:"🔄 Accumulation", desc:"Range / consolidation. Equal highs/lows. Low volatility.", c:col.accent },
                { phase:"⚡ Manipulation", desc:"Liquidity sweep above BSL or below SSL. Stop hunt. Wick through range.", c:col.sweep },
                { phase:"📦 Distribution", desc:"CHoCH confirms. Price impulses away from PD array.", c:col.bull },
              ].map(({phase,desc,c}) => (
                <div key={phase} style={{
                  marginBottom:8, paddingBottom:8,
                  borderBottom:`1px solid ${col.border}`,
                }}>
                  <div style={{ color:c, fontSize:11, fontWeight:700 }}>{phase}</div>
                  <div style={{ color:col.muted, fontSize:10, marginTop:2 }}>{desc}</div>
                </div>
              ))}
              <div style={{ color:col.muted, fontSize:9, marginTop:2, lineHeight:1.6 }}>
                PD Arrays: <span style={{ color:col.choch }}>FVG</span> (Fair Value Gap) ·{" "}
                <span style={{ color:col.choch }}>OB</span> (Order Block) ·{" "}
                <span style={{ color:col.choch }}>IFVG</span> (Inverse FVG)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
