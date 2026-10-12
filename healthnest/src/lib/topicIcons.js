import {
  Apple, Baby, Brain, Droplet, Dumbbell, Flower2, HeartPulse, Leaf, Moon, Sparkles, Stethoscope,
  Scale, Flame, GlassWater, Calculator,
} from "lucide-react";

// One consistent line icon per topic (lucide, the icon set shadcn/ui uses). Falls back to a stethoscope.
const TOPIC = {
  diabetes: Droplet,
  "heart-health": HeartPulse,
  "mental-health": Brain,
  "womens-health": Flower2,
  nutrition: Apple,
  fitness: Dumbbell,
  "skin-and-hair": Sparkles,
  sleep: Moon,
  "child-health": Baby,
  "home-remedies-and-ayurveda": Leaf,
};
export const topicIcon = (slug) => TOPIC[slug] || Stethoscope;

const TOOL = { bmi: Scale, calorie: Flame, water: GlassWater };
export const toolIcon = (type) => TOOL[type] || Calculator;
