// Pure calculator maths, kept apart from the screen so it can be tested. Every function returns either
// { error } or { title, text, rows? } (rows are label/value pairs shown under the headline result).

const inRange = (n, lo, hi) => Number.isFinite(n) && n >= lo && n <= hi;
// The tiny nudge stops values like 125.49999999999999 (really 125.5) rounding down.
const fmt = (n) => Math.round(n + 1e-9).toLocaleString("en-IN");

export const ACTIVITY = [
  ["1.2", "Little or no exercise"],
  ["1.375", "Light exercise 1-3 days a week"],
  ["1.55", "Moderate exercise 3-5 days a week"],
  ["1.725", "Hard exercise 6-7 days a week"],
];

export const GOALS = [
  ["lose", "Lose weight gradually"],
  ["maintain", "Maintain my weight"],
  ["gain", "Gain weight gradually"],
];

// Share of calories from carbohydrate / protein / fat. All sit inside the ranges health bodies call acceptable.
export const SPLITS = {
  balanced: { label: "Balanced (50% carbs, 20% protein, 30% fat)", carb: 0.5, protein: 0.2, fat: 0.3 },
  protein: { label: "Higher protein (40% carbs, 30% protein, 30% fat)", carb: 0.4, protein: 0.3, fat: 0.3 },
  lowcarb: { label: "Lower carb (30% carbs, 30% protein, 40% fat)", carb: 0.3, protein: 0.3, fat: 0.4 },
};

// Mifflin-St Jeor: the energy the body uses at rest.
const restingCalories = ({ weight, height, age, sex }) => 10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161);

function bmiBand(bmi) {
  // Asia-Pacific cut-offs, commonly used for Indian adults.
  if (bmi < 18.5) return "Below the healthy range";
  if (bmi < 23) return "Healthy range";
  if (bmi < 25) return "Above the healthy range (overweight)";
  return "Well above the healthy range";
}

export function calcBmi({ height, weight }) {
  if (!inRange(height, 100, 250) || !inRange(weight, 20, 300)) return { error: "Enter height between 100 and 250 cm and weight between 20 and 300 kg." };
  const bmi = weight / Math.pow(height / 100, 2);
  return { title: `Your BMI: ${bmi.toFixed(1)}`, text: bmiBand(bmi) };
}

export function calcCalorie({ height, weight, age, sex, activity }) {
  if (!inRange(height, 100, 250) || !inRange(weight, 20, 300) || !inRange(age, 15, 100)) return { error: "Enter age 15-100, height 100-250 cm and weight 20-300 kg." };
  const bmr = restingCalories({ weight, height, age, sex });
  return {
    title: `About ${fmt(bmr * activity)} calories a day`,
    text: `This is roughly what you use to maintain your current weight. Your resting needs are about ${fmt(bmr)} calories.`,
  };
}

export function calcWater({ weight, activity }) {
  if (!inRange(weight, 20, 300)) return { error: "Enter weight between 20 and 300 kg." };
  const litres = weight * 0.033 + (activity >= 1.55 ? 0.5 : 0); // rough guide
  return {
    title: `About ${litres.toFixed(1)} litres a day`,
    text: "This includes water from drinks and food. Needs rise with heat, illness and exercise. Some medical conditions need different limits, so follow your doctor's advice.",
  };
}

export function calcMacros({ height, weight, age, sex, activity, goal, split }) {
  if (!inRange(height, 100, 250) || !inRange(weight, 20, 300) || !inRange(age, 15, 100)) return { error: "Enter age 15-100, height 100-250 cm and weight 20-300 kg." };
  const mix = SPLITS[split];
  if (!mix || !["lose", "maintain", "gain"].includes(goal)) return { error: "Choose a goal and a macro split." };

  const maintenance = restingCalories({ weight, height, age, sex }) * activity;
  const floor = sex === "male" ? 1500 : 1200; // never suggest less than a commonly used safe minimum
  const wanted = maintenance + (goal === "lose" ? -500 : goal === "gain" ? 300 : 0);
  const target = Math.max(floor, wanted);
  const grams = { carb: (target * mix.carb) / 4, protein: (target * mix.protein) / 4, fat: (target * mix.fat) / 9 };

  const note = target > wanted + 0.5 ? " Your target was raised to a commonly used safe minimum." : "";
  return {
    title: `About ${fmt(target)} calories a day`,
    text: `Your maintenance level is about ${fmt(maintenance)} calories.${note} Carbohydrate and protein give 4 calories per gram, fat gives 9. These are starting points, not a prescription.`,
    rows: [
      ["Carbohydrates", `${fmt(grams.carb)} g`],
      ["Protein", `${fmt(grams.protein)} g`],
      ["Fat", `${fmt(grams.fat)} g`],
    ],
  };
}

const CYCLE_MIN = 90; // one sleep cycle
const FALL_ASLEEP_MIN = 15; // average time to drop off

const toMinutes = (hhmm) => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm || "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};
export const clock = (mins) => {
  const t = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(t % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const hoursLabel = (cycles) => `${cycles} cycles, ${(cycles * CYCLE_MIN) / 60} hours of sleep`;

// mode "wake": the time you must get up -> when to go to bed.  mode "bed": the time you go to bed -> when to wake.
export function calcSleep({ mode, time }) {
  const t = toMinutes(time);
  if (!Number.isFinite(t)) return { error: mode === "bed" ? "Enter the time you plan to go to bed." : "Enter the time you need to wake up." };

  const options = [6, 5, 4]; // 9, 7.5 and 6 hours
  if (mode === "bed") {
    return {
      title: `Go to bed at ${clock(t)} and wake at one of these times`,
      text: `Adults generally need 7 or more hours. Waking at the end of a 90-minute cycle often feels easier than waking in the middle of one. This allows ${FALL_ASLEEP_MIN} minutes to fall asleep.`,
      rows: options.slice().reverse().map((c) => [clock(t + FALL_ASLEEP_MIN + c * CYCLE_MIN), hoursLabel(c)]),
    };
  }
  return {
    title: `To wake at ${clock(t)}, go to bed at one of these times`,
    text: `Adults generally need 7 or more hours. Waking at the end of a 90-minute cycle often feels easier than waking in the middle of one. This allows ${FALL_ASLEEP_MIN} minutes to fall asleep.`,
    rows: options.map((c) => [clock(t - FALL_ASLEEP_MIN - c * CYCLE_MIN), hoursLabel(c)]),
  };
}

const MG_PER_MMOL = 18.016; // glucose
// ADAG study: estimated average glucose (mg/dL) = 28.7 x A1C - 46.7.
const a1cToMgdl = (a1c) => 28.7 * a1c - 46.7;
const mgdlToA1c = (mgdl) => (mgdl + 46.7) / 28.7;

function a1cBand(a1c) {
  if (a1c < 5.7) return "In the range usually seen in people without diabetes";
  if (a1c < 6.5) return "In the prediabetes range";
  return "In the diabetes range";
}

// mode "a1c": A1C % -> average glucose.  mode "glucose": average glucose (mg/dL or mmol/L) -> A1C %.
export function calcA1c({ mode, value, unit }) {
  let a1c;
  if (mode === "glucose") {
    const mgdl = unit === "mmol" ? value * MG_PER_MMOL : value;
    if (!inRange(mgdl, 40, 600)) return { error: unit === "mmol" ? "Enter average glucose between 2.2 and 33 mmol/L." : "Enter average glucose between 40 and 600 mg/dL." };
    a1c = mgdlToA1c(mgdl);
  } else {
    if (!inRange(value, 3, 20)) return { error: "Enter an A1C between 3 and 20 percent." };
    a1c = value;
  }
  const mgdl = a1cToMgdl(a1c);
  const caveat = "A1C is a screening result, not a diagnosis. Only a doctor can diagnose diabetes, and may repeat the test. Conditions such as anaemia or inherited haemoglobin differences can make A1C unreliable.";
  return {
    title: mode === "glucose" ? `Estimated A1C: ${a1c.toFixed(1)}%` : `A1C ${a1c.toFixed(1)}% means average glucose of about ${fmt(mgdl)} mg/dL`,
    text: `${a1cBand(a1c)} (American Diabetes Association cut-offs: below 5.7, 5.7 to 6.4, 6.5 and above). ${caveat}`,
    rows: [
      ["A1C", `${a1c.toFixed(1)} %`],
      ["Average glucose", `${fmt(mgdl)} mg/dL`],
      ["Average glucose", `${(mgdl / MG_PER_MMOL).toFixed(1)} mmol/L`],
    ],
  };
}

export const CALCULATORS = { bmi: calcBmi, calorie: calcCalorie, water: calcWater, macro: calcMacros, sleep: calcSleep, a1c: calcA1c };
