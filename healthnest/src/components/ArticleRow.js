import Link from "next/link";
import { Play } from "lucide-react";
import { formatDate } from "@/lib/text";

// One story in a list. Text first; a small image appears only if the article has one.
export default function ArticleRow({ article, compact = false, showExcerpt = true }) {
  const hasImg = !!article.coverImageUrl;
  return (
    <article className={`row${hasImg ? " has-img" : ""}${compact ? " compact" : ""}`}>
      <div>
        {article.category && <Link href={`/${article.category.slug}`} className="kicker">{article.category.name}</Link>}
        <h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3>
        {showExcerpt && !compact && <p className="line-clamp-2">{article.excerpt}</p>}
        <p className="meta tnum" style={{ marginTop: 8 }}>
          {article.author?.name}
          {article.publishedAt ? <> &middot; {formatDate(article.publishedAt)}</> : null}
          {" "}&middot; {article.readingTimeMin} min read
          {article.videoId && <> &middot; <span className="video-tag"><Play aria-hidden="true" fill="currentColor" />Video</span></>}
        </p>
      </div>
      {hasImg && (
        <Link href={`/articles/${article.slug}`} className="thumb" tabIndex={-1} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.coverImageUrl} alt="" loading="lazy" />
        </Link>
      )}
    </article>
  );
}
