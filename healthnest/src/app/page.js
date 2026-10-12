import Link from "next/link";
import {
  Search, ArrowRight, ChevronRight, ListTree, ShieldCheck, BadgeCheck, RefreshCw, BookOpen, MapPin, MessageSquareText,
} from "lucide-react";
import ArticleRow from "@/components/ArticleRow";
import LeadStory from "@/components/LeadStory";
import NewsletterForm from "@/components/NewsletterForm";
import HeroScene from "@/components/HeroScene";
import ScrollReveal from "@/components/ScrollReveal";
import CtaPair from "@/components/CtaPair";
import { BentoGrid, BentoTile } from "@/components/Bento";
import { TopicIcon } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategoriesWithCounts, getFeaturedArticles, getLatestArticles, getCalculators } from "@/lib/queries";
import { topicIcon, toolIcon } from "@/lib/topicIcons";

export const dynamic = "force-dynamic";

const WHY = [
  { Icon: ShieldCheck, text: "Every claim sourced", x: "6%", y: "9%" },
  { Icon: BadgeCheck, text: "Editor reviewed", x: "40%", y: "5%" },
  { Icon: RefreshCw, text: "Kept up to date", x: "66%", y: "14%" },
  { Icon: MessageSquareText, text: "Plain language", x: "30%", y: "30%" },
  { Icon: MapPin, text: "Made for India", x: "62%", y: "40%" },
  { Icon: BookOpen, text: "Free to read", x: "76%", y: "66%" },
];

const initials = (name = "") => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export default async function Home() {
  const [featured, latest, categories, tools] = await Promise.all([
    getFeaturedArticles(1),
    getLatestArticles(40),
    getCategoriesWithCounts(),
    getCalculators(),
  ]);

  const lead = featured[0] || latest[0];
  const sideStories = latest.filter((a) => a.id !== lead?.id).slice(0, 4);
  const totalArticles = categories.reduce((n, c) => n + c._count.articles, 0);
  const authorNames = [...new Set(latest.map((a) => a.author?.name).filter(Boolean))].slice(0, 3);

  // The three topics with the most articles become the cards in the grey band.
  const topCategories = [...categories].sort((a, b) => b._count.articles - a._count.articles || a.position - b.position).slice(0, 3);
  const newestIn = (slug) => latest.find((a) => a.category?.slug === slug);

  return (
    <>
      <section className="hero-home" aria-label="Welcome">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow hero-in">Health information for India</p>
            <h1 className="h-display hero-in">Discover clear answers to your health questions.</h1>
            <p className="lead-text hero-in">
              Plain-language articles where every claim links to its source, and an editor checks each piece before it goes live.
            </p>
            <div className="hero-actions hero-in">
              <CtaPair href="/conditions">Browse conditions</CtaPair>
            </div>
            <form action="/search" role="search" className="hero-search hero-in">
              <label htmlFor="hero-q" className="sr-only">Search health topics</label>
              <Input id="hero-q" name="q" type="search" placeholder="Search: diabetes diet, blood pressure, sleep" />
              <Button type="submit" variant="secondary" size="icon" aria-label="Search"><Search aria-hidden="true" /></Button>
            </form>
            <nav className="hero-topics hero-in" aria-label="Popular topics">
              {categories.slice(0, 4).map((c) => {
                const Icon = topicIcon(c.slug);
                return <Link key={c.id} href={`/${c.slug}`}><Icon aria-hidden="true" />{c.name}</Link>;
              })}
            </nav>
          </div>

          <div className="collage hero-in" aria-label="Highlights">
            <div className="c-tile c-ecg">
              <HeroScene />
              <div className="c-chip">
                <b>Checked before it is published</b>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span className="avatars" aria-hidden="true">{authorNames.map((n) => <span key={n}>{initials(n)}</span>)}</span>
                  <span className="tnum"><b>{totalArticles}</b> {totalArticles === 1 ? "article" : "articles"} and counting</span>
                </span>
              </div>
            </div>
            {lead ? (
              <Link href={`/articles/${lead.slug}`} className="c-tile c-lead">
                <span className="kicker">{lead.category?.name || "Latest"}</span>
                <h2>{lead.title}</h2>
                <span className="meta tnum">{lead.readingTimeMin} min read</span>
              </Link>
            ) : (
              <div className="c-tile c-lead"><span className="kicker">Coming soon</span><h2>The first articles are on the way.</h2></div>
            )}
            <div className="c-tile c-stat">
              <span className="lab">Topics covered</span>
              <span className="big">{categories.length}</span>
              <span className="lab">from diabetes to sleep, with more added every week.</span>
            </div>
          </div>
        </div>
      </section>

      <ScrollReveal as="section" className="band-grey" aria-labelledby="topics-heading">
        <div className="wrap">
          <div className="band-head reveal">
            <p className="eyebrow">Health topics</p>
            <h2 id="topics-heading" className="h-section">Topics we cover</h2>
            <p className="lead-text">Start with a topic, then follow its conditions, articles and tools. Each one is sourced and checked.</p>
          </div>
          <div className="svc-grid">
            {topCategories.map((c) => {
              const newest = newestIn(c.slug);
              return (
                <Link key={c.id} href={`/${c.slug}`} className="svc-card reveal">
                  <div className="svc-media">
                    {newest?.coverImageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={newest.coverImageUrl} alt="" loading="lazy" />
                      : <TopicIcon slug={c.slug} />}
                  </div>
                  <span className="svc-icon"><TopicIcon slug={c.slug} /></span>
                  <div className="svc-body">
                    <h3 className="svc-title">{c.name}</h3>
                    <p className="svc-text line-clamp-3">{newest ? newest.excerpt : c.description}</p>
                  </div>
                  <span className="svc-more">Read more <ArrowRight aria-hidden="true" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="wrap section" style={{ paddingBlock: 64 }}>
        <div className="band-head reveal">
          <p className="eyebrow">Latest</p>
          <h2 className="h-section">New on Healthnestt</h2>
        </div>
        {lead ? (
          <div className="top-grid">
            <div className="reveal"><LeadStory article={lead} /></div>
            <div>
              {sideStories.length === 0
                ? <p className="muted reveal">More stories are on the way.</p>
                : sideStories.map((a) => <div className="reveal" key={a.id}><ArticleRow article={a} compact /></div>)}
            </div>
          </div>
        ) : (
          <div className="card reveal" style={{ padding: 24 }}>
            <b>Nothing published yet</b>
            <p className="muted" style={{ margin: "4px 0 0" }}>The first articles will appear here once they have been reviewed and published.</p>
          </div>
        )}
      </ScrollReveal>

      <ScrollReveal as="section" className="wrap" aria-labelledby="why-heading">
        <div className="why reveal">
          <div className="why-pills">
            {WHY.map(({ Icon, text, x, y }) => (
              <Link key={text} href="/editorial-policy" className="why-pill" style={{ "--x": x, "--y": y }}>
                <Icon aria-hidden="true" />{text}<ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <div className="why-card">
            <p className="eyebrow">Why choose us</p>
            <h2 id="why-heading" className="h-section">Discover why readers trust Healthnestt.</h2>
            <p className="lead-text" style={{ marginBottom: 18 }}>Every article shows its sources, is checked by an editor, and is re-checked when guidance changes.</p>
            <CtaPair href="/editorial-policy">How we work</CtaPair>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="band-grey" style={{ marginTop: 64 }} id="topics" aria-labelledby="all-topics">
        <div className="wrap">
          <div className="band-head reveal">
            <p className="eyebrow">Explore</p>
            <h2 id="all-topics" className="h-section">All topics</h2>
          </div>
          <BentoGrid>
            {categories.map((c, i) => {
              const Icon = topicIcon(c.slug);
              const count = c._count.articles;
              const newest = latest.find((a) => a.category?.slug === c.slug);
              const size = i === 0 ? "lg" : i === 5 ? "wide" : "sm";
              return (
                <BentoTile
                  key={c.id}
                  href={`/${c.slug}`}
                  size={size}
                  tone={i === 0 ? "dark" : "default"}
                  icon={Icon}
                  title={c.name}
                  meta={`${count} ${count === 1 ? "article" : "articles"}`}
                >
                  {size !== "sm" && <p className="bento-text">{newest ? <>Latest: {newest.title}</> : c.description}</p>}
                </BentoTile>
              );
            })}
            <BentoTile href="/conditions" size="wide" tone="accent" icon={ListTree} title="Conditions A-Z">
              <p className="bento-text">Look up a health condition by name.</p>
            </BentoTile>
          </BentoGrid>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="wrap section" style={{ paddingBlock: 64 }} id="newsletter">
        <div className="top-grid">
          <div>
            <div className="band-head reveal">
              <p className="eyebrow">Tools</p>
              <h2 className="h-section">Quick health calculators</h2>
            </div>
            {tools.map((t) => {
              const Icon = toolIcon(t.type);
              return (
                <Link key={t.id} href={`/tools/${t.slug}`} className="tool-row reveal">
                  <span className="icon-wrap"><Icon aria-hidden="true" strokeWidth={1.75} /></span>
                  <span className="tool-text"><b>{t.name}</b><span>{t.description}</span></span>
                  <ChevronRight className="tool-go" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
          <div className="reveal">
            <div className="band-head">
              <p className="eyebrow">Weekly email</p>
              <h2 className="h-section" style={{ fontSize: 26 }}>New articles in your inbox</h2>
            </div>
            <p className="muted" style={{ margin: "0 0 14px" }}>One short email a week. Unsubscribe any time.</p>
            <NewsletterForm source="home" />
          </div>
        </div>
      </ScrollReveal>
    </>
  );
}
