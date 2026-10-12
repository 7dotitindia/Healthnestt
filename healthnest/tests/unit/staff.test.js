import { describe, it, expect } from "vitest";
import { pickActive } from "@/lib/dashNav";
import { isStaffPath } from "@/lib/paths";

const ADMIN = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/articles?status=submitted", label: "Review queue" },
  { href: "/admin/articles", label: "All articles" },
  { href: "/admin/articles/new", label: "New article" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
];
const WRITER = [
  { href: "/freelancer", label: "My articles" },
  { href: "/freelancer/new", label: "New article" },
];

describe("pickActive (which sidebar link is highlighted)", () => {
  it("highlights the dashboard only on its own page", () => {
    expect(pickActive(ADMIN, "/admin", "")).toBe("/admin");
    expect(pickActive(ADMIN, "/admin/users", "")).toBe("/admin/users");
  });
  it("tells Review queue and All articles apart by their status filter", () => {
    expect(pickActive(ADMIN, "/admin/articles", "status=submitted")).toBe("/admin/articles?status=submitted");
    expect(pickActive(ADMIN, "/admin/articles", "")).toBe("/admin/articles");
    expect(pickActive(ADMIN, "/admin/articles", "status=published")).toBe("/admin/articles");
  });
  it("keeps New article separate from All articles", () => {
    expect(pickActive(ADMIN, "/admin/articles/new", "")).toBe("/admin/articles/new");
  });
  it("puts a single article's page under All articles", () => {
    expect(pickActive(ADMIN, "/admin/articles/abc123", "")).toBe("/admin/articles");
    expect(pickActive(ADMIN, "/admin/categories/abc123", "")).toBe("/admin/categories");
  });
  it("puts a writer's article page under My articles", () => {
    expect(pickActive(WRITER, "/freelancer", "")).toBe("/freelancer");
    expect(pickActive(WRITER, "/freelancer/articles/abc", "")).toBe("/freelancer");
    expect(pickActive(WRITER, "/freelancer/new", "")).toBe("/freelancer/new");
  });
  it("does not confuse similar names", () => {
    expect(pickActive(ADMIN, "/admin/categoriesx", "")).toBe("/admin");
  });
  it("returns nothing for a page outside the area", () => {
    expect(pickActive(ADMIN, "/about", "")).toBeNull();
  });
});

describe("isStaffPath (where the public header and footer are hidden)", () => {
  it.each(["/admin", "/admin/articles", "/freelancer", "/freelancer/new", "/staff/login"])("%s is staff", (p) => {
    expect(isStaffPath(p)).toBe(true);
  });
  it.each(["/", "/diabetes", "/articles/admin-tips", "/tools/bmi", "/administration", "/search", "", undefined])("%s is public", (p) => {
    expect(isStaffPath(p)).toBe(false);
  });
});
