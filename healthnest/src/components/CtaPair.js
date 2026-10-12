import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// The reference design's call to action: a pill button followed by a round arrow button. Both go to the same place.
export default function CtaPair({ href, children, variant = "default" }) {
  return (
    <span className="cta-pair">
      <Button asChild variant={variant} size="lg"><Link href={href}>{children}</Link></Button>
      <Button asChild variant={variant} size="icon" className="size-12">
        <Link href={href} aria-hidden="true" tabIndex={-1}><ArrowUpRight /></Link>
      </Button>
    </span>
  );
}
