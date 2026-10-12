"use client";

import { usePathname } from "next/navigation";
import { isAuthPath, isStaffPath } from "@/lib/paths";

// Renders its children (the public header, footer, notices) everywhere except the staff area and the sign-in / sign-up pages.
// The children are still built on the server and passed in, so this adds no extra data fetching on the client.
export default function ChromeGate({ children }) {
  const pathname = usePathname();
  return isStaffPath(pathname) || isAuthPath(pathname) ? null : children;
}
