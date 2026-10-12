"use client";

import Link from "next/link";
import { pickActive } from "@/lib/dashNav";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, ClipboardCheck, Files, PenLine, Users, FolderTree, Stethoscope, ImageIcon, Mail, FileText, Send,
} from "lucide-react";

// Icons are chosen by name because the server layouts that build the link lists cannot pass components down.
const ICONS = {
  dashboard: LayoutDashboard, review: ClipboardCheck, articles: Files, write: PenLine, users: Users,
  categories: FolderTree, conditions: Stethoscope, media: ImageIcon, newsletter: Mail, mine: FileText, emails: Send,
};

export default function DashNav({ links }) {
  const pathname = usePathname() || "";
  const search = useSearchParams().toString();
  const active = pickActive(links, pathname, search);

  return (
    <nav aria-label="Dashboard" className="dash-nav">
      {links.map((l) => {
        const Icon = ICONS[l.icon] || FileText;
        return (
          <Link key={l.href} href={l.href} className="dash-link" aria-current={l.href === active ? "page" : undefined}>
            <Icon aria-hidden="true" strokeWidth={1.75} />
            <span>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
