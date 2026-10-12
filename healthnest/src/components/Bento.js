import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Bento grid: a tidy grid of tiles in different sizes. 4 columns on desktop, 2 on tablets, 1 on small phones.
// Tones: default (card), soft (sand), dark (petrol, like the hero), accent (saffron). Use accent once per grid at most.
export function BentoGrid({ className, children, ...props }) {
  return <div className={cn("bento", className)} {...props}>{children}</div>;
}

const SIZE = { sm: "", wide: "span-2", tall: "row-2", lg: "span-2 row-2 is-lg", full: "span-4" };

export function BentoTile({
  href, size = "sm", tone = "default", icon: Icon, kicker, title, meta, children, className, titleAs: Title = "h3", reveal = true, ...rest
}) {
  const cls = cn("bento-tile", SIZE[size], tone !== "default" && `tone-${tone}`, reveal && "reveal", className);
  const inner = (
    <>
      {Icon && <span className="bento-icon"><Icon aria-hidden="true" strokeWidth={1.75} /></span>}
      {kicker && <span className="bento-kicker">{kicker}</span>}
      {title && <Title className="bento-title">{title}</Title>}
      {children}
      {meta && <span className="bento-meta tnum">{meta}</span>}
      {href && <ArrowUpRight className="bento-go" aria-hidden="true" />}
    </>
  );
  return href
    ? <Link href={href} className={cls} {...rest}>{inner}</Link>
    : <div className={cls} {...rest}>{inner}</div>;
}
