"use client";

import { startTransition, useActionState } from "react";
import { reviewAction } from "@/app/actions/articles";

const CHECKLIST = [
  "Medical claims match the cited sources",
  "Sources are reputable and the links work",
  "No diagnosis, dosage instructions or cure claims",
  "Includes safety guidance (when to see a doctor)",
  "Plain language, medical terms explained",
  "Images are licensed and have alt text",
  "SEO title, description and slug are set",
];

// Which buttons make sense for each status (the server enforces the real rules).
const ACTIONS = {
  submitted: ["request_changes", "approve", "publish"],
  changes_requested: [],
  approved: ["publish"],
  published: ["unpublish", "archive"],
  archived: ["publish"],
  draft: [],
};
const LABEL = { request_changes: "Request changes", approve: "Approve", publish: "Publish", unpublish: "Unpublish", archive: "Archive" };
const STYLE = { request_changes: "btn-danger", approve: "btn-secondary", publish: "btn-primary", unpublish: "btn-secondary", archive: "btn-ghost" };

export default function ReviewPanel({ articleId, status }) {
  const [state, action, pending] = useActionState(reviewAction, null);
  const actions = ACTIONS[status] || [];
  const canPublish = actions.includes("publish");

  if (actions.length === 0) {
    return <p className="alert alert-info">No review actions for a {status.replace("_", " ")} article.</p>;
  }

  // Transition submit keeps the admin's note if the server rejects the action.
  const onSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget, e.nativeEvent.submitter);
    startTransition(() => action(data));
  };

  return (
    <form method="post" onSubmit={onSubmit} className="card" style={{ padding: 16 }}>
      <input type="hidden" name="id" value={articleId} />
      <h2 style={{ fontSize: 18, marginTop: 0 }}>Review</h2>

      {state?.errors?.length > 0 && (
        <div className="alert alert-bad" role="alert" style={{ marginBottom: 12 }}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      {canPublish && (
        <fieldset style={{ border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: 12, marginBottom: 12 }}>
          <legend style={{ fontWeight: 600, padding: "0 6px" }}>Publish checklist</legend>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--text-2)" }}>{CHECKLIST.map((c) => <li key={c}>{c}</li>)}</ul>
          <label style={{ display: "flex", gap: 8, marginTop: 8, fontWeight: 600 }}>
            <input type="checkbox" name="checklist" /> I have checked every item above
          </label>
        </fieldset>
      )}

      <div className="field">
        <label htmlFor="message">Note to freelancer {actions.includes("request_changes") ? "(required when requesting changes)" : "(optional)"}</label>
        <textarea id="message" name="message" className="textarea" />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {actions.map((a) => (
          <button key={a} type="submit" name="action" value={a} className={`btn ${STYLE[a]}`} disabled={pending}>{LABEL[a]}</button>
        ))}
      </div>
    </form>
  );
}
