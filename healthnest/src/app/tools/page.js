import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { BentoGrid, BentoTile } from "@/components/Bento";
import { getCalculators } from "@/lib/queries";
import { toolIcon } from "@/lib/topicIcons";
import { DISCLAIMER } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Health tools",
  description: "Free BMI, calorie, macronutrient, sleep, water intake and A1C calculators.",
  alternates: { canonical: "/tools" },
};

export default async function ToolsPage() {
  const tools = await getCalculators();
  return (
    <>
      <section className="page-head">
        <div className="wrap" style={{ padding: "28px 16px 24px" }}>
          <nav className="meta" aria-label="Breadcrumb"><Link href="/">Home</Link> / Tools</nav>
          <h1>Health tools</h1>
          <p className="muted" style={{ maxWidth: 680, margin: 0, fontSize: 17 }}>
            Simple calculators that give you a starting point. They are estimates, not medical advice.
          </p>
        </div>
      </section>

      <ScrollReveal className="wrap section">
        <BentoGrid>
          {tools.map((t, i) => {
            const Icon = toolIcon(t.type);
            return (
              <BentoTile key={t.id} href={`/tools/${t.slug}`} size={i === 0 ? "lg" : "wide"} tone={i === 0 ? "dark" : "default"} icon={Icon} title={t.name} meta="Open calculator">
                <p className="bento-text">{t.description}</p>
              </BentoTile>
            );
          })}
          <BentoTile size="full" tone="soft" icon={ShieldCheck} title="Read this first">
            <p className="bento-text">{DISCLAIMER} Results are estimates based on general formulas and cannot account for your health history.</p>
          </BentoTile>
        </BentoGrid>
      </ScrollReveal>
    </>
  );
}
