"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAuthPath, isStaffPath } from "@/lib/paths";
import { House, LayoutGrid, Calculator, Search } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", Icon: House, match: (p) => p === "/" },
  { href: "/conditions", label: "Topics", Icon: LayoutGrid, match: (p) => p.startsWith("/conditions") },
  { href: "/tools", label: "Tools", Icon: Calculator, match: (p) => p.startsWith("/tools") },
  { href: "/search", label: "Search", Icon: Search, match: (p) => p.startsWith("/search") },
];

// Phone-only navigation bar (hidden from 768px up with CSS).
export default function BottomNav() {
  const pathname = usePathname() || "/";
  if (isStaffPath(pathname) || isAuthPath(pathname)) return null;
  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {ITEMS.map(({ href, label, Icon, match }) => (
        <Link key={href} href={href} aria-current={match(pathname) ? "page" : undefined}>
          <Icon aria-hidden="true" strokeWidth={1.75} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
