import Link from "next/link";
import ArticleRow from "@/components/ArticleRow";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { countVideoArticles, getVideoArticles } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Videos",
  description: "Health videos with the full article and sources behind each one.",
  alternates: { canonical: "/videos" },
};

const PAGE_SIZE = 12;

export default async function VideosPage({ searchParams }) {
  const sp = await searchParams;
  const total = await countVideoArticles();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, parseInt(sp?.page, 10) || 1));
  const articles = await getVideoArticles(PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return (
    <>
      <section className="page-head">
        <div className="wrap" style={{ padding: "28px 16px 24px" }}>
          <nav className="meta" aria-label="Breadcrumb"><Link href="/">Home</Link> / Videos</nav>
          <h1>Videos</h1>
          <p className="muted" style={{ maxWidth: 680, margin: 0, fontSize: 17 }}>
            Every video sits inside an article, so you can read the sources behind what you watch.
          </p>
        </div>
      </section>

      <ScrollReveal className="wrap section">
        <div style={{ maxWidth: 860 }}>
          {articles.length === 0 ? (
            <div style={{ padding: "24px 0" }}>
              <b>No videos yet.</b>
              <p className="muted" style={{ margin: "4px 0 0" }}>Check back soon, or <Link href="/search">search the site</Link>.</p>
            </div>
          ) : (
            articles.map((a) => <div className="reveal" key={a.id}><ArticleRow article={a} /></div>)
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "space-between", alignItems: "center" }}>
              {page > 1 ? <Button asChild variant="outline" size="sm"><Link href={`/videos?page=${page - 1}`}>Previous</Link></Button> : <span />}
              <span className="meta tnum">Page {page} of {pages}</span>
              {page < pages ? <Button asChild variant="outline" size="sm"><Link href={`/videos?page=${page + 1}`}>Next</Link></Button> : <span />}
            </nav>
          )}
        </div>
      </ScrollReveal>
    </>
  );
}
