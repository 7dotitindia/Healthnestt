import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { setUserStatus } from "@/app/actions/users";
import NewFreelancerForm from "./NewFreelancerForm";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdmin();
  const users = await db.user.findMany({
    where: { role: { in: ["admin", "freelancer"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { articles: true } } },
  });

  return (
    <>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Users</h1>
      <div className="table-scroll">
        <table className="t">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Articles</th><th>Last login</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u._count.articles}</td>
                <td>{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}</td>
                <td><span className={u.status === "active" ? "badge badge-ok" : "badge"}>{u.status}</span></td>
                <td>
                  {u.role === "freelancer" && (
                    <form action={setUserStatus}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="status" value={u.status === "active" ? "deactivated" : "active"} />
                      <button className="btn btn-ghost btn-sm" type="submit">{u.status === "active" ? "Deactivate" : "Reactivate"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Add a freelancer</h2>
      <NewFreelancerForm />
    </>
  );
}
