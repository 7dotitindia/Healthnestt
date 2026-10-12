import Link from "next/link";
import { notFound } from "next/navigation";
import { PenLine } from "lucide-react";
import ArticleRow from "@/components/ArticleRow";
import ScrollReveal from "@/components/ScrollReveal";
import { BentoGrid, BentoTile } from "@/components/Bento";
import { getAuthorBySlug, getLatestArticles, countArticles } from "@/lib/queries";
import { topicIcon } from "@/lib/topicIcons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = await getAuthorBySlug(slug);
  return a ? { title: a.name, description: a.bio || `Articles by ${a.name}`, alternates: { canonical: `/authors/${slug}` } } : {};
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();
  const where = { authorId: author.id };
  const [articles, total] = await Promise.all([getLatestArticles(30, 0, where), countArticles(where)]);

  // The topics this author writes about, most frequent first.
  const counts = new Map();
  for (const a of articles) if (a.category) counts.set(a.category.slug, { name: a.category.name, slug: a.category.slug, n: (counts.get(a.category.slug)?.n || 0) + 1 });
  const topics = [...counts.values()].sort((x, y) => y.n - x.n);

  return (
    <>
      <section className="page-head">
        <div className="wrap" style={{ padding: "28px 16px 24px" }}>
          <nav className="meta" aria-label="Breadcrumb"><Link href="/">Home</Link> / Authors</nav>
          <h1>{author.name}</h1>
          {author.bio && <p className="muted" style={{ maxWidth: 680, margin: 0, fontSize: 17 }}>{author.bio}</p>}
        </div>
      </section>

      <ScrollReveal className="wrap section">
        <BentoGrid>
          <BentoTile size="wide" tone="dark" icon={PenLine} kicker="Published" title={`${total} ${total === 1 ? "article" : "articles"}`}>
            <p className="bento-text">Every article follows our <Link href="/editorial-policy" style={{ color: "inherit", textDecoration: "underline" }}>editorial policy</Link> and is checked by an editor before it is published.</p>
          </BentoTile>
          {topics.slice(0, 2).map((t) => (
            <BentoTile key={t.slug} href={`/${t.slug}`} icon={topicIcon(t.slug)} kicker="Writes about" title={t.name} meta={`${t.n} ${t.n === 1 ? "article" : "articles"}`} />
          ))}
        </BentoGrid>

        <div style={{ marginTop: 40, maxWidth: 860 }}>
          <div className="sec-head reveal"><h2>Articles by {author.name}</h2></div>
          {articles.length === 0
            ? <p className="muted" style={{ paddingTop: 16 }}>No published articles yet.</p>
            : articles.map((a) => <div className="reveal" key={a.id}><ArticleRow article={a} /></div>)}
        </div>
      </ScrollReveal>
    </>
  );
}
