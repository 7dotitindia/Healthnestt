import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ConditionForm } from "@/components/TaxonomyForms";

export const dynamic = "force-dynamic";

export default async function EditCondition({ params }) {
  await requireAdmin();
  const { id } = await params;
  const [condition, categories] = await Promise.all([
    db.condition.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } }),
    db.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] }),
  ]);
  if (!condition) notFound();

  return (
    <>
      <p className="meta"><Link href="/admin/conditions">Conditions</Link> / {condition.name}</p>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Edit condition</h1>
      <ConditionForm condition={condition} categories={categories} slugLocked={condition._count.articles > 0} />
    </>
  );
}
