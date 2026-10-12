import Link from "next/link";
import { formatDate } from "@/lib/text";

// The top story on the home page. No decoration: a headline, a summary and a byline.
export default function LeadStory({ article }) {
  return (
    <article className="lead">
      {article.coverImageUrl && (
        <Link href={`/articles/${article.slug}`} className="cover" style={{ display: "block", borderRadius: "var(--r-sm)", marginBottom: 16 }} tabIndex={-1} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.coverImageUrl} alt="" loading="eager" />
        </Link>
      )}
      {article.category && <Link href={`/${article.category.slug}`} className="kicker">{article.category.name}</Link>}
      <h2><Link href={`/articles/${article.slug}`}>{article.title}</Link></h2>
      <p>{article.excerpt}</p>
      <p className="meta tnum" style={{ fontSize: 14 }}>
        By {article.author?.name} &middot; {formatDate(article.publishedAt)} &middot; {article.readingTimeMin} min read
      </p>
    </article>
  );
}
