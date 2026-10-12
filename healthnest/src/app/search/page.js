import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import ArticleRow from "@/components/ArticleRow";
import { BentoGrid, BentoTile } from "@/components/Bento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategories, searchArticles } from "@/lib/queries";
import { topicIcon } from "@/lib/topicIcons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const query = String(sp?.q ?? "").slice(0, 100);
  const categories = await getCategories();
  const active = categories.find((c) => c.slug === sp?.c)?.slug || null;
  const hasQuery = query.trim().length >= 2;
  const results = hasQuery ? await searchArticles(query, 20, active) : [];
  const href = (c) => `/search?q=${encodeURIComponent(query)}${c ? `&c=${c}` : ""}`;

  return (
    <div className="wrap section" style={{ maxWidth: 900 }}>
      <h1 className="article-title" style={{ marginTop: 0 }}>Search</h1>
      <form action="/search" role="search" style={{ display: "flex", gap: 8, margin: "16px 0 14px", maxWidth: 620 }}>
        <label htmlFor="sq" className="sr-only">Search health topics</label>
        <Input id="sq" name="q" type="search" defaultValue={query} placeholder="Search health topics" />
        {active && <input type="hidden" name="c" value={active} />}
        <Button type="submit"><SearchIcon aria-hidden="true" />Search</Button>
      </form>

      {hasQuery && (
        <div className="filter-row" role="group" aria-label="Filter by topic" style={{ marginBottom: 18 }}>
          <Link href={href(null)} className="filter-chip" aria-current={!active ? "true" : undefined}>All topics</Link>
          {categories.map((c) => (
            <Link key={c.id} href={href(c.slug)} className="filter-chip" aria-current={active === c.slug ? "true" : undefined}>{c.name}</Link>
          ))}
        </div>
      )}

      {!hasQuery ? (
        <>
          <p className="muted" style={{ marginBottom: 20 }}>Type at least 2 characters, or start from a topic.</p>
          <BentoGrid>
            {categories.slice(0, 8).map((c) => (
              <BentoTile key={c.id} href={`/${c.slug}`} icon={topicIcon(c.slug)} title={c.name} reveal={false} />
            ))}
          </BentoGrid>
        </>
      ) : results.length === 0 ? (
        <div style={{ padding: "8px 0" }}>
          <b>No results for &ldquo;{query}&rdquo;{active ? " in this topic" : ""}.</b>
          <p className="muted" style={{ margin: "4px 0 16px" }}>
            {active ? <>Try <Link href={href(null)}>searching all topics</Link>, or a different word.</> : "Try a different word, or start from a topic."}
          </p>
          <BentoGrid>
            {categories.slice(0, 4).map((c) => (
              <BentoTile key={c.id} href={`/${c.slug}`} icon={topicIcon(c.slug)} title={c.name} reveal={false} />
            ))}
          </BentoGrid>
        </div>
      ) : (
        <>
          <p className="meta tnum" role="status">{results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;</p>
          {results.map((a) => <ArticleRow key={a.id} article={a} />)}
        </>
      )}
    </div>
  );
}
