import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { CategoryForm } from "@/components/TaxonomyForms";

export const dynamic = "force-dynamic";

export default async function EditCategory({ params }) {
  await requireAdmin();
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } });
  if (!category) notFound();

  return (
    <>
      <p className="meta"><Link href="/admin/categories">Categories</Link> / {category.name}</p>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Edit category</h1>
      {!category.isActive && <p className="alert alert-warn" style={{ marginBottom: 12 }}>This category is inactive. Its page and menu link are hidden, but its articles stay published.</p>}
      <CategoryForm category={category} slugLocked={category._count.articles > 0} />
    </>
  );
}
