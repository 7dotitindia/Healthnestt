import Link from "next/link";
import { Activity, Menu, Search, ArrowUpRight } from "lucide-react";
import { getCategories } from "@/lib/queries";
import { SITE_NAME } from "@/lib/constants";
import { topicIcon } from "@/lib/topicIcons";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";

// Floating pill navigation, as in the reference design: logo on the left, links in the middle, outlined button on the right.
export default async function SiteHeader() {
  const categories = await getCategories();
  const nav = [
    { href: "/", label: "Home" },
    { href: "/conditions", label: "Conditions" },
    { href: "/tools", label: "Tools" },
    ...categories.slice(0, 2).map((c) => ({ href: `/${c.slug}`, label: c.name })),
    { href: "/about", label: "About" },
  ];

  return (
    <header className="site-header">
      <div className="wrap">
        <div className="nav-pill">
          <Link href="/" className="brand">
            <Activity className="size-5" aria-hidden="true" />
            {SITE_NAME}
          </Link>

          <nav aria-label="Main" className="nav-center hidden md:flex">
            {nav.map((n) => <Link key={n.href} href={n.href} className="nav-link">{n.label}</Link>)}
          </nav>

          <div className="nav-actions">
            <ThemeToggle />
            <Link href="/search" className="nav-cta">
              <Search className="mr-2 size-4" aria-hidden="true" />Search
            </Link>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden border-primary text-primary">
                <Menu aria-hidden="true" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="text-xl font-bold text-primary">{SITE_NAME}</SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>
              <nav aria-label="Mobile" className="flex flex-col overflow-y-auto">
                <SheetClose asChild>
                  <Link href="/search" className="sheet-link"><Search aria-hidden="true" />Search</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/conditions" className="sheet-link"><ArrowUpRight aria-hidden="true" />Conditions A-Z</Link>
                </SheetClose>
                {categories.map((c) => {
                  const Icon = topicIcon(c.slug);
                  return (
                    <SheetClose asChild key={c.id}>
                      <Link href={`/${c.slug}`} className="sheet-link"><Icon aria-hidden="true" />{c.name}</Link>
                    </SheetClose>
                  );
                })}
                <SheetClose asChild>
                  <Link href="/tools" className="sheet-link"><ArrowUpRight aria-hidden="true" />Health tools</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/about" className="sheet-link"><ArrowUpRight aria-hidden="true" />About</Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
