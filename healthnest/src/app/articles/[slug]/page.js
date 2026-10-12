import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleRow from "@/components/ArticleRow";
import NewsletterForm from "@/components/NewsletterForm";
import ShareButtons from "@/components/ShareButtons";
import ViewTracker from "@/components/ViewTracker";
import ReadingProgress from "@/components/ReadingProgress";
import ScrollReveal from "@/components/ScrollReveal";
import { BentoGrid, BentoTile } from "@/components/Bento";
import { Calculator } from "lucide-react";
import { topicIcon } from "@/lib/topicIcons";
import { getArticleBySlug, getRelatedArticles } from "@/lib/queries";
import { DISCLAIMER, SITE_NAME, SITE_URL } from "@/lib/constants";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) return {};
  const title = a.seoTitle || a.title;
  const description = a.seoDescription || a.excerpt;
  const canonical = a.canonicalUrl || `/articles/${a.slug}`;
  const image = a.coverImageUrl ? [`${SITE_URL}${a.coverImageUrl}`] : undefined;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, type: "article", url: canonical,
      publishedTime: a.publishedAt?.toISOString(),
      modifiedTime: a.lastReviewedAt?.toISOString(),
      authors: [a.author.name],
      images: image,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image },
  };
}

// Adds ids to h2/h3 headings and builds the table of contents.
function withToc(html) {
  const toc = [];
  const out = html.replace(/<(h2|h3)>(.*?)<\/\1>/g, (_m, tag, inner) => {
    const text = inner.replace(/<[^>]*>/g, "");
    const id = `s-${toc.length + 1}`;
    if (tag === "h2") toc.push({ id, text });
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
  return { html: out, toc };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article);
  const { html, toc } = withToc(article.body);
  const url = `${SITE_URL}/articles/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImageUrl ? [`${SITE_URL}${article.coverImageUrl}`] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: (article.lastReviewedAt || article.publishedAt)?.toISOString(),
    author: { "@type": "Person", name: article.author.name, url: `${SITE_URL}/authors/${article.author.slug}` },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: url,
  };

  const tocBlock = toc.length > 1 && (
    <nav className="callout toc" aria-label="In this article">
      <b style={{ fontSize: 14 }}>In this article</b>
      <ol style={{ margin: "8px 0 0", paddingLeft: 20, display: "grid", gap: 6, fontSize: 14 }}>
        {toc.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}
      </ol>
    </nav>
  );

  return (
    <div className="wrap section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewTracker slug={article.slug} />
      <ReadingProgress targetSelector="#article-body" />

      <div className="two-col">
        <article style={{ maxWidth: 740 }}>
          <nav className="meta" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            {article.category && (article.category.isActive
              ? <> / <Link href={`/${article.category.slug}`}>{article.category.name}</Link></>
              : <> / {article.category.name}</>)}
          </nav>
          <h1 className="article-title">{article.title}</h1>
          <p className="muted" style={{ fontSize: 19, margin: "0 0 16px" }}>{article.excerpt}</p>

          <p className="byline tnum" style={{ margin: "0 0 12px" }}>
            By <Link href={`/authors/${article.author.slug}`}>{article.author.name}</Link>
            {" "}&middot; Published {formatDate(article.publishedAt)}
            {article.lastReviewedAt && <> &middot; Updated {formatDate(article.lastReviewedAt)}</>}
            {" "}&middot; {article.readingTimeMin} min read
          </p>
          <div style={{ marginBottom: 16 }}><ShareButtons url={url} title={article.title} /></div>
          <p className="disclaimer" style={{ margin: "0 0 24px" }}>{DISCLAIMER}</p>

          {article.coverImageUrl && (
            <div className="cover" style={{ borderRadius: "var(--r-sm)", marginBottom: 24 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.coverImageUrl} alt={article.coverImageAlt || ""} />
            </div>
          )}

          <div className="lg:hidden" style={{ marginBottom: 24 }}>{tocBlock}</div>

          <div id="article-body" className="prose" dangerouslySetInnerHTML={{ __html: html }} />

          {article.sources.length > 0 && (
            <section style={{ borderTop: "1px solid var(--border-strong)", marginTop: 40, paddingTop: 16 }} aria-labelledby="sources">
              <h2 id="sources" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Sources</h2>
              <ol style={{ paddingLeft: 22, fontSize: 14, color: "var(--text-2)", display: "grid", gap: 6, margin: 0 }}>
                {article.sources.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} rel="noopener noreferrer" target="_blank">{s.title}</a>. {s.publisher}
                    {s.publishedYear ? `, ${s.publishedYear}` : ""}.
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section style={{ borderTop: "1px solid var(--border)", marginTop: 28, paddingTop: 16 }} aria-label="About the author">
            <p style={{ margin: 0 }}>
              <b><Link href={`/authors/${article.author.slug}`} style={{ color: "inherit" }}>{article.author.name}</Link></b>
            </p>
            {article.author.bio && <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>{article.author.bio}</p>}
            <p className="meta" style={{ margin: "8px 0 0" }}>This article follows our <Link href="/editorial-policy">editorial policy</Link>.</p>
          </section>
        </article>

        <aside className="sticky-col" aria-label="More from Healthnestt">
          <div className="hidden lg:block">{tocBlock}</div>
          <div className="callout">
            <b>Weekly email</b>
            <p className="muted" style={{ margin: "4px 0 12px", fontSize: 14 }}>New articles, one short email a week.</p>
            <NewsletterForm source="article" />
          </div>
          <p style={{ margin: 0, fontSize: 14 }}>Try our <Link href="/tools">health calculators</Link> for BMI, calories and water.</p>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="section" style={{ maxWidth: 740 }}>
          <div className="sec-head"><h2>Related articles</h2></div>
          {related.map((a) => <ArticleRow key={a.id} article={a} />)}
        </section>
      )}

      <ScrollReveal as="section" className="section" aria-label="Discover more">
        <div className="sec-head reveal"><h2>Discover more</h2></div>
        <BentoGrid style={{ marginTop: 16 }}>
          {article.category && (
            <BentoTile href={`/${article.category.slug}`} size="wide" tone="dark" icon={topicIcon(article.category.slug)} kicker="Topic" title={`More in ${article.category.name}`}>
              <p className="bento-text">{article.category.description}</p>
            </BentoTile>
          )}
          {article.condition && (
            <BentoTile href={`/conditions/${article.condition.slug}`} icon={topicIcon(article.category?.slug)} kicker="Condition" title={article.condition.name} />
          )}
          <BentoTile href="/tools" tone="accent" icon={Calculator} title="Health tools">
            <p className="bento-text">BMI, calories and water.</p>
          </BentoTile>
        </BentoGrid>
      </ScrollReveal>
    </div>
  );
}
