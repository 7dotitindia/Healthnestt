import {
  Apple, Baby, Brain, Droplet, Dumbbell, Flower2, HeartPulse, Leaf, Moon, Sparkles, Stethoscope,
  Scale, Flame, GlassWater, Calculator,
} from "lucide-react";

// Render-ready icons for topics and tools (same mapping as src/lib/topicIcons.js, for places that need a plain element).
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
const TOOL = { bmi: Scale, calorie: Flame, water: GlassWater };

export function TopicIcon({ slug, ...props }) {
  const C = TOPIC[slug] ?? Stethoscope;
  return <C aria-hidden="true" strokeWidth={1.75} {...props} />;
}

export function ToolIcon({ type, ...props }) {
  const C = TOOL[type] ?? Calculator;
  return <C aria-hidden="true" strokeWidth={1.75} {...props} />;
}
