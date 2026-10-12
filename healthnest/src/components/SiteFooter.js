import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE, DISCLAIMER } from "@/lib/constants";
import { getCategories } from "@/lib/queries";

const about = [["/about", "About us"], ["/editorial-policy", "Editorial policy"], ["/advertising-policy", "Advertising policy"], ["/contact", "Contact"]];
const legal = [["/privacy", "Privacy"], ["/terms", "Terms of use"], ["/disclaimer", "Medical disclaimer"], ["/staff/login", "Staff login"]];

export default async function SiteFooter() {
  const categories = await getCategories();
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg-soft)", marginTop: 48 }}>
      <div className="wrap" style={{ padding: "36px 16px 24px" }}>
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand">{SITE_NAME}</Link>
            <p className="muted" style={{ margin: "8px 0 0", fontSize: 14, maxWidth: 300 }}>{SITE_TAGLINE}. Articles cite their sources and are checked by an editor before publication.</p>
          </div>
          <nav aria-label="Topics"><h3>Topics</h3>
            <ul>{categories.slice(0, 6).map((c) => <li key={c.id}><Link href={`/${c.slug}`}>{c.name}</Link></li>)}</ul>
          </nav>
          <nav aria-label="About"><h3>About</h3>
            <ul>{about.map(([h, l]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Legal"><h3>Legal</h3>
            <ul>{legal.map(([h, l]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
          </nav>
        </div>
        <p className="disclaimer" style={{ marginTop: 28 }}>{DISCLAIMER}</p>
        <p className="meta" style={{ marginTop: 12 }}>&copy; {new Date().getFullYear()} {SITE_NAME}</p>
      </div>
    </footer>
  );
}
