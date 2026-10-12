import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteMedia } from "@/app/actions/media";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireAdmin();
  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { uploadedBy: { select: { name: true } } },
  });
  const usage = await Promise.all(
    assets.map((a) =>
      db.article.count({ where: { OR: [{ coverImageUrl: a.url }, { body: { contains: a.url } }] } }),
    ),
  );

  return (
    <>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Media library ({assets.length})</h1>
      <p className="meta">Images are uploaded from the article editor. Only unused images can be deleted.</p>
      {assets.length === 0 ? <div className="empty-state"><b style={{ color: "var(--foreground)" }}>No uploads yet</b><span>Images you add in the article editor will appear here.</span></div> : (
        <div className="grid-cards" style={{ marginTop: 16 }}>
          {assets.map((a, i) => (
            <div key={a.id} className="card">
              <div className="cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.originalName || "Uploaded image"} loading="lazy" />
              </div>
              <div className="body">
                <p className="meta" style={{ margin: 0, wordBreak: "break-all" }}>{a.originalName || a.filename}</p>
                <p className="meta" style={{ margin: "4px 0" }}>
                  {(a.sizeBytes / 1024).toFixed(0)} KB | {a.uploadedBy.name} | {formatDate(a.createdAt)}
                </p>
                <p style={{ margin: "4px 0 8px" }}>
                  <span className={usage[i] ? "badge badge-ok" : "badge badge-warn"}>
                    {usage[i] ? `Used in ${usage[i]} article${usage[i] === 1 ? "" : "s"}` : "Unused"}
                  </span>
                </p>
                {usage[i] === 0 && (
                  <form action={deleteMedia}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="btn btn-danger btn-sm">Delete</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
