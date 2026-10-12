import ArticleEditor from "@/components/ArticleEditor";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminNewArticle() {
  await requireAdmin();
  const [categories, conditions] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
    db.condition.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>New article</h1>
      <ArticleEditor categories={categories} conditions={conditions} isAdmin />
    </>
  );
}
