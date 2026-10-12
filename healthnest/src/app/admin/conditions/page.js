import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ConditionForm } from "@/components/TaxonomyForms";
import { deleteCondition } from "@/app/actions/taxonomy";

export const dynamic = "force-dynamic";

export default async function ConditionsAdmin({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const [conditions, categories] = await Promise.all([
    db.condition.findMany({
      orderBy: { name: "asc" },
      include: { category: { select: { name: true } }, _count: { select: { articles: true } } },
    }),
    db.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Conditions</h1>
      {sp?.created && <p className="alert alert-ok" role="status">Added &ldquo;{sp.created}&rdquo;.</p>}
      {sp?.saved && <p className="alert alert-ok" role="status">Saved &ldquo;{sp.saved}&rdquo;.</p>}
      {sp?.deleted && <p className="alert alert-ok" role="status">Deleted &ldquo;{sp.deleted}&rdquo;.</p>}
      {sp?.blocked && <p className="alert alert-warn" role="alert">That condition has articles, so it can&apos;t be deleted. Mark it inactive instead.</p>}

      {conditions.length === 0 ? <div className="empty-state"><b style={{ color: "var(--foreground)" }}>No conditions yet</b><span>Add one with the form below.</span></div> : (
        <div className="table-scroll" style={{ marginTop: 12 }}>
          <table className="t">
            <thead><tr><th>Name</th><th>Category</th><th>URL</th><th>Articles</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {conditions.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.category.name}</td>
                  <td>/conditions/{c.slug}</td>
                  <td>{c._count.articles}</td>
                  <td><span className={c.isActive ? "badge badge-ok" : "badge"}>{c.isActive ? "Active" : "Inactive"}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link href={`/admin/conditions/${c.id}`}>Edit</Link>
                    {c._count.articles === 0 && (
                      <form action={deleteCondition} style={{ display: "inline", marginLeft: 12 }}>
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
      )}

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Add a condition</h2>
      <ConditionForm categories={categories} />
    </>
  );
}
