import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Info } from "lucide-react";
import Calculator from "@/components/Calculator";
import ScrollReveal from "@/components/ScrollReveal";
import { BentoGrid, BentoTile } from "@/components/Bento";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/queries";
import { ToolIcon, TopicIcon } from "@/components/Icons";
import { DISCLAIMER } from "@/lib/constants";

export const dynamic = "force-dynamic";

const getTool = (slug) => db.calculator.findFirst({ where: { slug, isActive: true } });

// Plain explanations of what each calculator does, and which topics to read next.
const ABOUT = {
  bmi: {
    how: "Body mass index is your weight in kilograms divided by your height in metres, squared. For Indian adults, a healthy range is commonly taken as 18.5 to 22.9.",
    limit: "BMI does not measure body fat or muscle, so it can mislead for athletes, older adults and during pregnancy.",
    topics: ["nutrition", "fitness", "diabetes"],
  },
  calorie: {
    how: "This uses the Mifflin-St Jeor equation to estimate the energy your body needs at rest, then multiplies it by your activity level.",
    limit: "It is an average for adults. Individual needs vary with body composition, health conditions, pregnancy and medicines.",
    topics: ["nutrition", "fitness"],
  },
  water: {
    how: "A rough target of about 33 millilitres per kilogram of body weight, plus a little extra if you exercise hard. It counts water from drinks and food.",
    limit: "Needs rise with heat and illness. Some heart, kidney and other conditions need different limits, so follow your doctor's advice.",
    topics: ["nutrition", "fitness"],
  },
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const t = await getTool(slug);
  return t ? { title: t.name, description: t.description, alternates: { canonical: `/tools/${slug}` } } : {};
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) notFound();

  const about = ABOUT[tool.type];
  const categories = await getCategories();
  const next = (about?.topics || []).map((s) => categories.find((c) => c.slug === s)).filter(Boolean);

  return (
    <>
      <section className="page-head">
        <div className="wrap" style={{ padding: "28px 16px 24px" }}>
          <nav className="meta" aria-label="Breadcrumb"><Link href="/tools">Tools</Link> / {tool.name}</nav>
          <h1 style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="bento-icon" style={{ width: 48, height: 48 }}><ToolIcon type={tool.type} style={{ width: 24, height: 24 }} /></span>
            {tool.name}
          </h1>
          <p className="muted" style={{ maxWidth: 640, margin: 0, fontSize: 17 }}>{tool.description}</p>
        </div>
      </section>

      <ScrollReveal className="wrap section">
        <div className="top-grid" style={{ alignItems: "start" }}>
          <div className="reveal"><Calculator type={tool.type} /></div>
          <div style={{ display: "grid", gap: 14 }}>
            {about && (
              <BentoTile tone="soft" icon={Info} kicker="How it works" title="What this calculates" titleAs="h2">
                <p className="bento-text" style={{ color: "var(--foreground)" }}>{about.how}</p>
                <p className="bento-text">{about.limit}</p>
              </BentoTile>
            )}
            {next.length > 0 && (
              <BentoTile tone="default" icon={BookOpen} kicker="Keep reading" title="Related topics" titleAs="h2">
                <ul className="bento-list">
                  {next.map((c) => (
                    <li key={c.id}>
                      <Link href={`/${c.slug}`}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <TopicIcon slug={c.slug} className="size-4" style={{ color: "var(--primary)" }} />{c.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </BentoTile>
            )}
          </div>
        </div>
        <p className="disclaimer reveal" style={{ marginTop: 24, maxWidth: 860 }}>{DISCLAIMER} Results are estimates only.</p>
      </ScrollReveal>
    </>
  );
}
