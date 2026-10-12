"use client";

import { useState } from "react";

const num = (v) => (v === "" ? NaN : Number(v));

function bmiBand(bmi) {
  // Asia-Pacific cut-offs, commonly used for Indian adults.
  if (bmi < 18.5) return "Below the healthy range";
  if (bmi < 23) return "Healthy range";
  if (bmi < 25) return "Above the healthy range (overweight)";
  return "Well above the healthy range";
}

const ACTIVITY = [
  ["1.2", "Little or no exercise"],
  ["1.375", "Light exercise 1-3 days a week"],
  ["1.55", "Moderate exercise 3-5 days a week"],
  ["1.725", "Hard exercise 6-7 days a week"],
];

export default function Calculator({ type }) {
  const [f, setF] = useState({ height: "", weight: "", age: "", sex: "female", activity: "1.375" });
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function submit(e) {
    e.preventDefault();
    const h = num(f.height), w = num(f.weight), a = num(f.age);
    if (type === "bmi") {
      if (!(h >= 100 && h <= 250) || !(w >= 20 && w <= 300)) return setResult({ error: "Enter height between 100 and 250 cm and weight between 20 and 300 kg." });
      const bmi = w / Math.pow(h / 100, 2);
      return setResult({ title: `Your BMI: ${bmi.toFixed(1)}`, text: bmiBand(bmi) });
    }
    if (type === "calorie") {
      if (!(h >= 100 && h <= 250) || !(w >= 20 && w <= 300) || !(a >= 15 && a <= 100))
        return setResult({ error: "Enter age 15-100, height 100-250 cm and weight 20-300 kg." });
      const bmr = 10 * w + 6.25 * h - 5 * a + (f.sex === "male" ? 5 : -161); // Mifflin-St Jeor
      const tdee = Math.round(bmr * Number(f.activity));
      return setResult({ title: `About ${tdee.toLocaleString("en-IN")} calories a day`, text: `This is roughly what you use to maintain your current weight. Your resting needs are about ${Math.round(bmr).toLocaleString("en-IN")} calories.` });
    }
    if (type === "water") {
      if (!(w >= 20 && w <= 300)) return setResult({ error: "Enter weight between 20 and 300 kg." });
      const base = w * 0.033; // litres, rough guide
      const extra = Number(f.activity) >= 1.55 ? 0.5 : 0;
      const l = base + extra;
      return setResult({ title: `About ${l.toFixed(1)} litres a day`, text: "This includes water from drinks and food. Needs rise with heat, illness and exercise. Some medical conditions need different limits, so follow your doctor's advice." });
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 20 }} noValidate>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {type !== "water" && (
          <div className="field"><label htmlFor="height">Height (cm)</label><input id="height" className="input" inputMode="decimal" value={f.height} onChange={set("height")} placeholder="170" /></div>
        )}
        <div className="field"><label htmlFor="weight">Weight (kg)</label><input id="weight" className="input" inputMode="decimal" value={f.weight} onChange={set("weight")} placeholder="65" /></div>
        {type === "calorie" && (
          <>
            <div className="field"><label htmlFor="age">Age (years)</label><input id="age" className="input" inputMode="numeric" value={f.age} onChange={set("age")} placeholder="30" /></div>
            <div className="field"><label htmlFor="sex">Sex</label>
              <select id="sex" className="select input" value={f.sex} onChange={set("sex")}><option value="female">Female</option><option value="male">Male</option></select>
            </div>
          </>
        )}
        {type !== "bmi" && (
          <div className="field"><label htmlFor="activity">Activity level</label>
            <select id="activity" className="select input" value={f.activity} onChange={set("activity")}>
              {ACTIVITY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
      </div>
      <button className="btn btn-primary" type="submit">Calculate</button>

      <div aria-live="polite" style={{ marginTop: 16 }}>
        {result?.error && <p className="alert alert-bad">{result.error}</p>}
        {result && !result.error && (
          <div className="callout"><b>{result.title}</b><p style={{ margin: "4px 0 0" }}>{result.text}</p></div>
        )}
      </div>
    </form>
  );
}
