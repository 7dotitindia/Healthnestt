import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoTile } from "@/components/Bento";
import { getCategories } from "@/lib/queries";
import { topicIcon } from "@/lib/topicIcons";

export const metadata = { title: "Page not found" };

export default async function NotFound() {
  const categories = await getCategories();
  return (
    <div className="wrap section" style={{ maxWidth: 860 }}>
      <p className="kicker">404</p>
      <h1 className="article-title" style={{ marginTop: 4 }}>We couldn&apos;t find that page</h1>
      <p className="muted" style={{ fontSize: 18, maxWidth: 560 }}>It may have moved or no longer exists. Search, or start from one of these topics.</p>
      <p style={{ display: "flex", gap: 12, margin: "20px 0 28px", flexWrap: "wrap" }}>
        <Button asChild><Link href="/search"><Search aria-hidden="true" />Search</Link></Button>
        <Button asChild variant="outline"><Link href="/">Home</Link></Button>
      </p>
      <BentoGrid>
        {categories.slice(0, 4).map((c) => (
          <BentoTile key={c.id} href={`/${c.slug}`} icon={topicIcon(c.slug)} title={c.name} reveal={false} />
        ))}
      </BentoGrid>
    </div>
  );
}
