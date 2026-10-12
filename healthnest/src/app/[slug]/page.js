import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator, FileText } from "lucide-react";
import ArticleRow from "@/components/ArticleRow";
import ScrollReveal from "@/components/ScrollReveal";
import { BentoGrid, BentoTile } from "@/components/Bento";
import { Button } from "@/components/ui/button";
import {
  getCategoryBySlug, getPage, getPages, getLatestArticles, countArticles, getConditionsWithCounts,
} from "@/lib/queries";
import { TopicIcon } from "@/components/Icons";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

// Root-level slugs are either a category (/diabetes) or a static page (/about).
async function resolve(slug) {
  const category = await getCategoryBySlug(slug);
  if (category) return { type: "category", category };
  const page = await getPage(slug);
  if (page) return { type: "page", page };
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) return {};
  if (r.type === "category") {
    return { title: r.category.name, description: r.category.description, alternates: { canonical: `/${slug}` } };
  }
  return { title: r.page.seoTitle || r.page.title, description: r.page.seoDescription || undefined, alternates: { canonical: `/${slug}` } };
}

export default async function RootSlugPage({ params, searchParams }) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();

  if (r.type === "page") return <StaticPage page={r.page} slug={slug} />;

  const { category } = r;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page, 10) || 1);
  const where = { categoryId: category.id };

  const [articles, total, allConditions] = await Promise.all([
    getLatestArticles(PAGE_SIZE, (page - 1) * PAGE_SIZE, where),
    countArticles(where),
    getConditionsWithCounts(),
  ]);
  const conditions = allConditions.filter((c) => c.categoryId === category.id);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // First page only: the bento "featured" block and a section per condition.
  const featured = page === 1 ? await getLatestArticles(3, 0, where) : [];
  const [lead, ...more] = featured;
  const sections = page === 1
    ? await Promise.all(
        conditions.filter((c) => c._count.articles > 0).map(async (c) => ({ condition: c, items: await getLatestArticles(3, 0, { conditionId: c.id }) })),
      )
    : [];

  return (
    <>
      <section className="page-head">
        <div className="wrap" style={{ padding: "28px 16px 24px" }}>
          <nav className="meta" aria-label="Breadcrumb"><Link href="/">Home</Link> / {category.name}</nav>
          <h1 style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="bento-icon" style={{ width: 48, height: 48 }}><TopicIcon slug={category.slug} style={{ width: 24, height: 24 }} /></span>
            {category.name}
          </h1>
          <p className="muted" style={{ maxWidth: 680, margin: 0, fontSize: 17 }}>{category.description}</p>
          <p className="meta tnum" style={{ marginTop: 10 }}>{total} {total === 1 ? "article" : "articles"}</p>
        </div>
      </section>

      {conditions.length > 0 && (
        <nav className="subnav" aria-label={`${category.name} conditions`}>
          <div className="wrap subnav-inner">
            <Link href={`/${category.slug}`} aria-current="page">Overview</Link>
            {conditions.map((c) => <Link key={c.id} href={`/conditions/${c.slug}`}>{c.name}</Link>)}
            <Link href="/tools">Tools</Link>
          </div>
        </nav>
      )}

      <ScrollReveal className="wrap section">
        {lead && (
          <BentoGrid>
            <BentoTile href={`/articles/${lead.slug}`} size="lg" tone="dark" kicker="Start here" title={lead.title}>
              {lead.coverImageUrl && (
                <span className="bento-cover" style={{ order: -1 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lead.coverImageUrl} alt="" />
                </span>
              )}
              <p className="bento-text">{lead.excerpt}</p>
              <span className="bento-meta tnum">{lead.author?.name} &middot; {lead.readingTimeMin} min read</span>
            </BentoTile>
            {more.map((a) => (
              <BentoTile key={a.id} href={`/articles/${a.slug}`} kicker={formatDate(a.publishedAt)} title={a.title} meta={`${a.readingTimeMin} min read`} />
            ))}
            {conditions.length > 0 && (
              <BentoTile size={more.length >= 2 ? "wide" : "lg"} tone="soft" kicker="Conditions" title={`Explore ${category.name}`}>
                <ul className="bento-list">
                  {conditions.slice(0, 5).map((c) => (
                    <li key={c.id}><Link href={`/conditions/${c.slug}`}><span>{c.name}</span><span className="count">{c._count.articles}</span></Link></li>
                  ))}
                </ul>
              </BentoTile>
            )}
            <BentoTile href="/tools" size="full" tone="accent" icon={Calculator} title="Health tools">
              <p className="bento-text">BMI, calorie and water calculators.</p>
            </BentoTile>
          </BentoGrid>
        )}

        {sections.map(({ condition, items }) => (
          <div key={condition.id} style={{ marginTop: 40 }}>
            <div className="sec-head reveal">
              <h2>{condition.name}</h2>
              <Link href={`/conditions/${condition.slug}`}>View all</Link>
            </div>
            {items.map((a) => <div className="reveal" key={a.id}><ArticleRow article={a} /></div>)}
          </div>
        ))}

        <div style={{ marginTop: lead ? 40 : 0, maxWidth: 860 }}>
          <div className="sec-head reveal"><h2>{page === 1 && lead ? `All ${category.name} articles` : "Articles"}</h2></div>
          {articles.length === 0 ? (
            <div style={{ padding: "24px 0" }}>
              <b>No articles in this topic yet.</b>
              <p className="muted" style={{ margin: "4px 0 0" }}>Check back soon, or <Link href="/search">search the site</Link>.</p>
            </div>
          ) : (
            articles.map((a) => <div className="reveal" key={a.id}><ArticleRow article={a} /></div>)
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "space-between", alignItems: "center" }}>
              {page > 1 ? <Button asChild variant="outline" size="sm"><Link href={`/${slug}?page=${page - 1}`}>Previous</Link></Button> : <span />}
              <span className="meta tnum">Page {page} of {pages}</span>
              {page < pages ? <Button asChild variant="outline" size="sm"><Link href={`/${slug}?page=${page + 1}`}>Next</Link></Button> : <span />}
            </nav>
          )}
        </div>
      </ScrollReveal>
    </>
  );
}

async function StaticPage({ page, slug }) {
  const pages = await getPages();
  return (
    <div className="wrap section">
      <div className="doc-layout">
        <nav aria-label="About Healthnestt" className="page-nav" style={{ alignContent: "start" }}>
          <span className="meta" style={{ padding: "0 12px 6px", display: "flex", alignItems: "center", gap: 6 }}><FileText className="size-3.5" aria-hidden="true" />About Healthnestt</span>
          {pages.map((p) => (
            <Link key={p.slug} href={`/${p.slug}`} aria-current={p.slug === slug ? "page" : undefined}>{p.title}</Link>
          ))}
        </nav>
        <article style={{ maxWidth: 740 }}>
          <h1 className="article-title" style={{ marginTop: 0 }}>{page.title}</h1>
          <div className="prose" dangerouslySetInnerHTML={{ __html: page.body }} />
        </article>
      </div>
    </div>
  );
}
