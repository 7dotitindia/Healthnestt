import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { CategoryForm } from "@/components/TaxonomyForms";
import { deleteCategory } from "@/app/actions/taxonomy";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const categories = await db.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true, conditions: true } } },
  });

  return (
    <>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Categories</h1>
      {sp?.created && <p className="alert alert-ok" role="status">Added &ldquo;{sp.created}&rdquo;.</p>}
      {sp?.saved && <p className="alert alert-ok" role="status">Saved &ldquo;{sp.saved}&rdquo;.</p>}
      {sp?.deleted && <p className="alert alert-ok" role="status">Deleted &ldquo;{sp.deleted}&rdquo;.</p>}
      {sp?.blocked && <p className="alert alert-warn" role="alert">That category has articles or conditions, so it can&apos;t be deleted. Mark it inactive instead.</p>}

      <div className="table-scroll" style={{ marginTop: 12 }}>
        <table className="t">
          <thead><tr><th>#</th><th>Name</th><th>URL</th><th>Articles</th><th>Conditions</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.position}</td>
                <td>{c.name}</td>
                <td>/{c.slug}</td>
                <td>{c._count.articles}</td>
                <td>{c._count.conditions}</td>
                <td><span className={c.isActive ? "badge badge-ok" : "badge"}>{c.isActive ? "Active" : "Inactive"}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Link href={`/admin/categories/${c.id}`}>Edit</Link>
                  {c._count.articles === 0 && c._count.conditions === 0 && (
                    <form action={deleteCategory} style={{ display: "inline", marginLeft: 12 }}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }}>Delete</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Add a category</h2>
      <CategoryForm />
    </>
  );
}
