import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import { getConditionsWithCounts } from "@/lib/queries";
import { topicIcon } from "@/lib/topicIcons";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Health conditions A-Z",
  description: "Browse health conditions explained in plain language.",
  alternates: { canonical: "/conditions" },
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default async function ConditionsPage() {
  const conditions = await getConditionsWithCounts();
  const groups = {};
  for (const c of conditions) (groups[c.name[0].toUpperCase()] ||= []).push(c);
  const present = new Set(Object.keys(groups));

  return (
    <>
      <section className="page-head">
        <div className="wrap" style={{ padding: "28px 16px 24px" }}>
          <nav className="meta" aria-label="Breadcrumb"><Link href="/">Home</Link> / Conditions</nav>
          <h1>Health conditions A-Z</h1>
          <p className="muted" style={{ maxWidth: 680, margin: "0 0 18px", fontSize: 17 }}>
            Look up a condition by name. Each page links to the articles we have on it.
          </p>
          <nav className="letters" aria-label="Jump to letter">
            {LETTERS.map((l) => present.has(l)
              ? <a key={l} href={`#letter-${l}`}>{l}</a>
              : <span key={l} aria-hidden="true">{l}</span>)}
          </nav>
        </div>
      </section>

      <ScrollReveal className="wrap section">
        {conditions.length === 0 ? (
          <p className="muted">Conditions will appear here soon.</p>
        ) : (
          <div className="az-grid">
            {Object.entries(groups).map(([letter, items]) => (
              <section key={letter} className="reveal" aria-labelledby={`letter-${letter}`}>
                <h2 id={`letter-${letter}`} className="az-letter">{letter}</h2>
                <ul className="bento-list">
                  {items.map((c) => {
                    const Icon = topicIcon(c.category.slug);
                    return (
                      <li key={c.id}>
                        <Link href={`/conditions/${c.slug}`}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                            <Icon className="size-4" style={{ color: "var(--primary)" }} aria-hidden="true" strokeWidth={1.75} />
                            {c.name}
                          </span>
                          <span className="count">{c._count.articles} {c._count.articles === 1 ? "article" : "articles"}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </ScrollReveal>
    </>
  );
}
