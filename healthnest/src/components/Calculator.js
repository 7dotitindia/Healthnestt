"use client";

import { useState } from "react";
import { ACTIVITY, CALCULATORS, GOALS, SPLITS } from "@/lib/calculators";

const num = (v) => (v === "" ? NaN : Number(v));

// Which inputs each calculator shows.
const FIELDS = {
  bmi: ["height", "weight"],
  calorie: ["height", "weight", "age", "sex", "activity"],
  water: ["weight", "activity"],
  macro: ["height", "weight", "age", "sex", "activity", "goal", "split"],
  sleep: ["sleepMode", "time"],
  a1c: ["a1cMode", "value", "unit"],
};

export default function Calculator({ type }) {
  const [f, setF] = useState({
    height: "", weight: "", age: "", sex: "female", activity: "1.375", goal: "maintain", split: "balanced",
    sleepMode: "wake", time: "", a1cMode: "a1c", value: "", unit: "mgdl",
  });
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const show = (name) => (FIELDS[type] || []).includes(name);

  function submit(e) {
    e.preventDefault();
    const run = CALCULATORS[type];
    if (!run) return;
    setResult(
      run({
        height: num(f.height), weight: num(f.weight), age: num(f.age), sex: f.sex, activity: Number(f.activity),
        goal: f.goal, split: f.split,
        mode: type === "sleep" ? f.sleepMode : f.a1cMode, time: f.time, value: num(f.value), unit: f.unit,
      }),
    );
  }

  const valueLabel = f.a1cMode === "a1c" ? "A1C (%)" : f.unit === "mmol" ? "Average glucose (mmol/L)" : "Average glucose (mg/dL)";
  const valuePlaceholder = f.a1cMode === "a1c" ? "6.5" : f.unit === "mmol" ? "7.8" : "140";

  return (
    <form onSubmit={submit} className="card" style={{ padding: 20 }} noValidate>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {show("sleepMode") && (
          <div className="field"><label htmlFor="sleepMode">I want to</label>
            <select id="sleepMode" className="select input" value={f.sleepMode} onChange={set("sleepMode")}>
              <option value="wake">Find a bedtime for my wake-up time</option>
              <option value="bed">Find a wake-up time for my bedtime</option>
            </select>
          </div>
        )}
        {show("time") && (
          <div className="field"><label htmlFor="time">{f.sleepMode === "bed" ? "I plan to go to bed at" : "I need to wake up at"}</label>
            <input id="time" type="time" className="input" value={f.time} onChange={set("time")} />
          </div>
        )}
        {show("a1cMode") && (
          <div className="field"><label htmlFor="a1cMode">I want to</label>
            <select id="a1cMode" className="select input" value={f.a1cMode} onChange={set("a1cMode")}>
              <option value="a1c">Convert A1C to average glucose</option>
              <option value="glucose">Convert average glucose to A1C</option>
            </select>
          </div>
        )}
        {show("value") && (
          <div className="field"><label htmlFor="value">{valueLabel}</label>
            <input id="value" className="input" inputMode="decimal" value={f.value} onChange={set("value")} placeholder={valuePlaceholder} />
          </div>
        )}
        {show("unit") && f.a1cMode === "glucose" && (
          <div className="field"><label htmlFor="unit">Glucose unit</label>
            <select id="unit" className="select input" value={f.unit} onChange={set("unit")}>
              <option value="mgdl">mg/dL</option>
              <option value="mmol">mmol/L</option>
            </select>
          </div>
        )}
        {show("height") && (
          <div className="field"><label htmlFor="height">Height (cm)</label><input id="height" className="input" inputMode="decimal" value={f.height} onChange={set("height")} placeholder="170" /></div>
        )}
        {show("weight") && (
          <div className="field"><label htmlFor="weight">Weight (kg)</label><input id="weight" className="input" inputMode="decimal" value={f.weight} onChange={set("weight")} placeholder="65" /></div>
        )}
        {show("age") && (
          <div className="field"><label htmlFor="age">Age (years)</label><input id="age" className="input" inputMode="numeric" value={f.age} onChange={set("age")} placeholder="30" /></div>
        )}
        {show("sex") && (
          <div className="field"><label htmlFor="sex">Sex</label>
            <select id="sex" className="select input" value={f.sex} onChange={set("sex")}><option value="female">Female</option><option value="male">Male</option></select>
          </div>
        )}
        {show("activity") && (
          <div className="field"><label htmlFor="activity">Activity level</label>
            <select id="activity" className="select input" value={f.activity} onChange={set("activity")}>
              {ACTIVITY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
        {show("goal") && (
          <div className="field"><label htmlFor="goal">Goal</label>
            <select id="goal" className="select input" value={f.goal} onChange={set("goal")}>
              {GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
        {show("split") && (
          <div className="field"><label htmlFor="split">Macro split</label>
            <select id="split" className="select input" value={f.split} onChange={set("split")}>
              {Object.entries(SPLITS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>
      <button className="btn btn-primary" type="submit">Calculate</button>

      <div aria-live="polite" style={{ marginTop: 16 }}>
        {result?.error && <p className="alert alert-bad">{result.error}</p>}
        {result && !result.error && (
          <div className="callout">
            <b>{result.title}</b>
            {result.rows && (
              <dl style={{ margin: "12px 0 0", display: "grid", gap: 6 }}>
                {result.rows.map(([label, value], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    <dt style={{ margin: 0 }}>{label}</dt>
                    <dd className="tnum" style={{ margin: 0, fontWeight: 600, textAlign: "right" }}>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p style={{ margin: "10px 0 0" }}>{result.text}</p>
          </div>
        )}
      </div>
    </form>
  );
}
