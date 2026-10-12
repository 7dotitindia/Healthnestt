import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator, FileText } from "lucide-react";
import ArticleRow from "@/components/ArticleRow";
import ScrollReveal from "@/components/ScrollReveal";
import { BentoGrid, BentoTile } from "@/components/Bento";
import { getConditionBySlug, getConditionsWithCounts, getLatestArticles } from "@/lib/queries";
import { topicIcon } from "@/lib/topicIcons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = await getConditionBySlug(slug);
  return c ? { title: c.name, description: c.overview.slice(0, 155), alternates: { canonical: `/conditions/${slug}` } } : {};
}

export default async function ConditionPage({ params }) {
  const { slug } = await params;
  const condition = await getConditionBySlug(slug);
  if (!condition) notFound();

  const [articles, allConditions] = await Promise.all([
    getLatestArticles(12, 0, { conditionId: condition.id }),
    getConditionsWithCounts(),
  ]);
  const related = allConditions.filter((c) => c.categoryId === condition.categoryId && c.id !== condition.id).slice(0, 3);

  return (
    <>
      <section className="page-head" id="overview">
        <div className="wrap" style={{ padding: "28px 16px 24px" }}>
          <nav className="meta" aria-label="Breadcrumb">
            <Link href="/conditions">Conditions</Link> / <Link href={`/${condition.category.slug}`}>{condition.category.name}</Link> / {condition.name}
          </nav>
          <h1>{condition.name}</h1>
          <p className="muted" style={{ maxWidth: 720, margin: 0, fontSize: 18 }}>{condition.overview}</p>
        </div>
      </section>

      <nav className="subnav" aria-label="On this page">
        <div className="wrap subnav-inner">
          <a href="#overview">Overview</a>
          <a href="#articles">Articles{articles.length ? ` (${articles.length})` : ""}</a>
          <a href="#discover">Discover more</a>
        </div>
      </nav>

      <ScrollReveal className="wrap section">
        <div id="articles" style={{ maxWidth: 860, scrollMarginTop: 130 }}>
          <div className="sec-head reveal"><h2>Articles about {condition.name}</h2></div>
          {articles.length === 0 ? (
            <div style={{ padding: "24px 0" }}>
              <b>No articles on this condition yet.</b>
              <p className="muted" style={{ margin: "4px 0 0" }}>See everything in <Link href={`/${condition.category.slug}`}>{condition.category.name}</Link>.</p>
            </div>
          ) : (
            articles.map((a) => <div className="reveal" key={a.id}><ArticleRow article={a} /></div>)
          )}
        </div>

        <div id="discover" style={{ marginTop: 48, scrollMarginTop: 130 }}>
          <div className="sec-head reveal"><h2>Discover more</h2></div>
          <BentoGrid style={{ marginTop: 16 }}>
            <BentoTile href={`/${condition.category.slug}`} size="wide" tone="dark" icon={topicIcon(condition.category.slug)} kicker="Topic" title={`More in ${condition.category.name}`}>
              <p className="bento-text">{condition.category.description}</p>
            </BentoTile>
            {related.map((c) => {
              const RIcon = topicIcon(c.category.slug);
              return (
                <BentoTile key={c.id} href={`/conditions/${c.slug}`} icon={RIcon} kicker="Related condition" title={c.name}
                  meta={`${c._count.articles} ${c._count.articles === 1 ? "article" : "articles"}`} />
              );
            })}
            <BentoTile href="/tools" size={related.length >= 2 ? "wide" : "sm"} tone="accent" icon={Calculator} title="Health tools">
              <p className="bento-text">BMI, calorie and water calculators.</p>
            </BentoTile>
            <BentoTile href="/editorial-policy" tone="soft" icon={FileText} title="How we check sources">
              <p className="bento-text">Our editorial policy.</p>
            </BentoTile>
          </BentoGrid>
        </div>
      </ScrollReveal>
    </>
  );
}
