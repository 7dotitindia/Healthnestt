import { describe, it, expect } from "vitest";
import { calcBmi, calcCalorie, calcWater, calcMacros, calcSleep, calcA1c, clock, CALCULATORS, SPLITS } from "@/lib/calculators";

const woman = { height: 165, weight: 60, age: 30, sex: "female", activity: 1.375 };
const rowMap = (r) => Object.fromEntries(r.rows.map(([k, v]) => [k, v]));

describe("existing calculators keep their results", () => {
  it("BMI", () => {
    expect(calcBmi({ height: 170, weight: 65 }).title).toBe("Your BMI: 22.5");
    expect(calcBmi({ height: 170, weight: 65 }).text).toBe("Healthy range");
    expect(calcBmi({ height: 160, weight: 45 }).text).toBe("Below the healthy range");
    expect(calcBmi({ height: 160, weight: 62 }).text).toBe("Above the healthy range (overweight)");
    expect(calcBmi({ height: 160, weight: 90 }).text).toBe("Well above the healthy range");
  });
  it("calories (Mifflin-St Jeor)", () => {
    expect(calcCalorie(woman).title).toBe("About 1,815 calories a day");
    expect(calcCalorie({ ...woman, sex: "male" }).title).toBe("About 2,044 calories a day");
  });
  it("water", () => {
    expect(calcWater({ weight: 60, activity: 1.2 }).title).toBe("About 2.0 litres a day");
    expect(calcWater({ weight: 60, activity: 1.55 }).title).toBe("About 2.5 litres a day");
  });
  it.each([
    ["BMI", () => calcBmi({ height: NaN, weight: 65 })],
    ["calories", () => calcCalorie({ ...woman, age: 10 })],
    ["water", () => calcWater({ weight: 5, activity: 1.2 })],
  ])("%s rejects out-of-range input", (_n, fn) => expect(fn().error).toBeTruthy());
});

describe("macronutrient calculator", () => {
  it("splits maintenance calories into grams", () => {
    const r = calcMacros({ ...woman, goal: "maintain", split: "balanced" });
    expect(r.title).toBe("About 1,815 calories a day");
    // 1815.3 kcal: 50% carbs / 4, 20% protein / 4, 30% fat / 9
    expect(rowMap(r)).toEqual({ Carbohydrates: "227 g", Protein: "91 g", Fat: "61 g" });
  });
  it("takes 500 off to lose and adds 300 to gain", () => {
    expect(calcMacros({ ...woman, goal: "lose", split: "balanced" }).title).toBe("About 1,315 calories a day");
    expect(calcMacros({ ...woman, goal: "gain", split: "balanced" }).title).toBe("About 2,115 calories a day");
  });
  it("never goes below a safe minimum, and says so", () => {
    const small = { height: 150, weight: 40, age: 60, sex: "female", activity: 1.2, goal: "lose", split: "balanced" };
    const r = calcMacros(small);
    expect(r.title).toBe("About 1,200 calories a day");
    expect(r.text).toMatch(/safe minimum/);
    expect(calcMacros({ ...small, sex: "male" }).title).toBe("About 1,500 calories a day");
  });
  it("every split adds up to 100% and the grams add back to the calorie target", () => {
    for (const [name, s] of Object.entries(SPLITS)) {
      expect(s.carb + s.protein + s.fat).toBeCloseTo(1, 10);
      const r = calcMacros({ ...woman, goal: "maintain", split: name });
      const g = Object.values(rowMap(r)).map((v) => parseInt(v, 10));
      expect(g[0] * 4 + g[1] * 4 + g[2] * 9).toBeGreaterThan(1815 - 25);
      expect(g[0] * 4 + g[1] * 4 + g[2] * 9).toBeLessThan(1815 + 25);
    }
  });
  it("rejects bad input", () => {
    expect(calcMacros({ ...woman, goal: "maintain", split: "nope" }).error).toBeTruthy();
    expect(calcMacros({ ...woman, goal: "bulk", split: "balanced" }).error).toBeTruthy();
    expect(calcMacros({ ...woman, weight: 500, goal: "maintain", split: "balanced" }).error).toBeTruthy();
  });
});

describe("sleep calculator", () => {
  it("formats times on a 12-hour clock, including midnight and noon", () => {
    expect(clock(0)).toBe("12:00 AM");
    expect(clock(12 * 60)).toBe("12:00 PM");
    expect(clock(13 * 60 + 5)).toBe("1:05 PM");
    expect(clock(-15)).toBe("11:45 PM");
    expect(clock(1440 + 30)).toBe("12:30 AM");
  });
  it("counts back from the wake-up time, allowing 15 minutes to fall asleep", () => {
    const r = calcSleep({ mode: "wake", time: "06:30" });
    expect(r.rows).toEqual([
      ["9:15 PM", "6 cycles, 9 hours of sleep"],
      ["10:45 PM", "5 cycles, 7.5 hours of sleep"],
      ["12:15 AM", "4 cycles, 6 hours of sleep"],
    ]);
  });
  it("counts forward from bedtime, crossing midnight", () => {
    const r = calcSleep({ mode: "bed", time: "23:00" });
    expect(r.rows).toEqual([
      ["5:15 AM", "4 cycles, 6 hours of sleep"],
      ["6:45 AM", "5 cycles, 7.5 hours of sleep"],
      ["8:15 AM", "6 cycles, 9 hours of sleep"],
    ]);
  });
  it.each(["", "25:00", "6:30", "ab:cd", undefined])("rejects the time %j", (time) => {
    expect(calcSleep({ mode: "wake", time }).error).toMatch(/wake/);
    expect(calcSleep({ mode: "bed", time }).error).toMatch(/bed/);
  });
});

describe("A1C calculator", () => {
  it("converts well-known A1C values (ADAG)", () => {
    const seven = calcA1c({ mode: "a1c", value: 7 });
    expect(seven.rows[1][1]).toBe("154 mg/dL");
    expect(seven.rows[2][1]).toBe("8.6 mmol/L");
    const r = calcA1c({ mode: "a1c", value: 6 });
    expect(r.rows[1][1]).toBe("126 mg/dL");
    expect(r.rows[2][1]).toBe("7.0 mmol/L");
    expect(calcA1c({ mode: "a1c", value: 5.7 }).rows[1][1]).toBe("117 mg/dL");
  });
  it("converts glucose back to A1C in either unit", () => {
    expect(calcA1c({ mode: "glucose", value: 154, unit: "mgdl" }).title).toBe("Estimated A1C: 7.0%");
    expect(calcA1c({ mode: "glucose", value: 8.5, unit: "mmol" }).title).toBe("Estimated A1C: 7.0%");
  });
  it("names the cut-off band at the boundaries", () => {
    expect(calcA1c({ mode: "a1c", value: 5.6 }).text).toMatch(/without diabetes/);
    expect(calcA1c({ mode: "a1c", value: 5.7 }).text).toMatch(/prediabetes range/);
    expect(calcA1c({ mode: "a1c", value: 6.4 }).text).toMatch(/prediabetes range/);
    expect(calcA1c({ mode: "a1c", value: 6.5 }).text).toMatch(/diabetes range/);
  });
  it("always says it is not a diagnosis", () => {
    for (const v of [5, 6, 9]) expect(calcA1c({ mode: "a1c", value: v }).text).toMatch(/not a diagnosis/);
  });
  it.each([
    [{ mode: "a1c", value: 2.9 }],
    [{ mode: "a1c", value: 20.1 }],
    [{ mode: "a1c", value: NaN }],
    [{ mode: "glucose", value: 39, unit: "mgdl" }],
    [{ mode: "glucose", value: 601, unit: "mgdl" }],
    [{ mode: "glucose", value: 2, unit: "mmol" }],
    [{ mode: "glucose", value: 34, unit: "mmol" }],
  ])("rejects %j", (input) => expect(calcA1c(input).error).toBeTruthy());
});

describe("calculator registry", () => {
  it("has one entry for every type the database may hold", () => {
    expect(Object.keys(CALCULATORS).sort()).toEqual(["a1c", "bmi", "calorie", "macro", "sleep", "water"]);
  });
});
