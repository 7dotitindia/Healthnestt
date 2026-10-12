import Link from "next/link";
import { Activity, Menu, Search, ArrowUpRight, LogIn, UserPlus, User, Play } from "lucide-react";
import { getCategories } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import ProfileMenu from "@/components/ProfileMenu";
import { SITE_NAME } from "@/lib/constants";
import { topicIcon } from "@/lib/topicIcons";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";

// Floating pill navigation, as in the reference design: logo on the left, links in the middle, outlined button on the right.
export default async function SiteHeader() {
  const [categories, user] = await Promise.all([getCategories(), getCurrentUser()]);
  const dashboard = user?.role === "admin" ? { href: "/admin", label: "Admin dashboard" } : user?.role === "freelancer" ? { href: "/freelancer", label: "Writer dashboard" } : null;
  // News goes first among the topic links so it is always one click away; the rest follow in the admin's order.
  const news = categories.find((c) => c.slug === "news");
  const navTopics = [news, ...categories.filter((c) => c !== news)].filter(Boolean).slice(0, 2);
  const nav = [
    { href: "/", label: "Home" },
    { href: "/conditions", label: "Conditions" },
    { href: "/tools", label: "Tools" },
    ...navTopics.map((c) => ({ href: `/${c.slug}`, label: c.name })),
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

          <nav aria-label="Main" className="nav-center hidden min-[1140px]:flex">
            {nav.map((n) => <Link key={n.href} href={n.href} className="nav-link">{n.label}</Link>)}
          </nav>

          <div className="nav-actions">
            <ThemeToggle />
            <Link href="/search" className="nav-cta">
              <Search className="mr-2 size-4" aria-hidden="true" />Search
            </Link>
            {user ? (
              <ProfileMenu name={user.name} dashboard={dashboard} />
            ) : (
              <>
                <Link href="/login" className="nav-user-icon" aria-label="Log in or sign up"><User aria-hidden="true" /></Link>
                <Link href="/login" className="nav-login">Log in</Link>
                <Link href="/signup" className="nav-signup">Sign up</Link>
              </>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="min-[1140px]:hidden border-primary text-primary">
                <Menu aria-hidden="true" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="text-xl font-bold text-primary">{SITE_NAME}</SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>
              <nav aria-label="Mobile" className="flex flex-col overflow-y-auto">
                {user ? (
                  <SheetClose asChild>
                    <Link href="/account" className="sheet-link"><User aria-hidden="true" />My account</Link>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link href="/login" className="sheet-link"><LogIn aria-hidden="true" />Log in</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/signup" className="sheet-link"><UserPlus aria-hidden="true" />Sign up</Link>
                    </SheetClose>
                  </>
                )}
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
                  <Link href="/videos" className="sheet-link"><Play aria-hidden="true" />Videos</Link>
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
