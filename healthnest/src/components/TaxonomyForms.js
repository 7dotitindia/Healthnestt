"use client";

import { startTransition, useActionState } from "react";
import { saveCategory, saveCondition } from "@/app/actions/taxonomy";

// Submit through a transition so a validation error does not clear what the admin typed.
function useKeepFields(action) {
  return (e) => {
    e.preventDefault();
    startTransition(() => action(new FormData(e.currentTarget, e.nativeEvent.submitter)));
  };
}

function Errors({ state }) {
  if (!state?.errors?.length) return null;
  return (
    <div className="alert alert-bad" role="alert" style={{ marginBottom: 12 }}>
      <ul style={{ margin: 0, paddingLeft: 20 }}>{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
    </div>
  );
}

export function CategoryForm({ category, slugLocked }) {
  const [state, action, pending] = useActionState(saveCategory, null);
  const onSubmit = useKeepFields(action);
  return (
    <form method="post" onSubmit={onSubmit} className="card" style={{ padding: 16, maxWidth: 560 }}>
      {category && <input type="hidden" name="id" value={category.id} />}
      <Errors state={state} />
      <div className="field"><label htmlFor="name">Name</label>
        <input id="name" name="name" className="input" defaultValue={category?.name} maxLength={60} required /></div>
      <div className="field"><label htmlFor="slug">URL slug</label>
        <input id="slug" name="slug" className="input" defaultValue={category?.slug} disabled={slugLocked} placeholder="Leave blank to create from the name" />
        <span className="hint">
          {slugLocked
            ? "Locked because this category already has articles, so its web address stays stable."
            : "This becomes the page address, like /diabetes. Lowercase letters, numbers and hyphens."}
        </span></div>
      <div className="field"><label htmlFor="description">Description</label>
        <textarea id="description" name="description" className="textarea" defaultValue={category?.description} maxLength={300} required />
        <span className="hint">20-300 characters. Shown on the category page and used for search engines.</span></div>
      <div className="field"><label htmlFor="position">Menu position</label>
        <input id="position" name="position" className="input" inputMode="numeric" defaultValue={category?.position ?? 0} style={{ maxWidth: 120 }} />
        <span className="hint">Lower numbers come first. The first four categories appear in the site header.</span></div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <input type="checkbox" name="isActive" defaultChecked={category ? category.isActive : true} /> Active (visible on the site)
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Saving..." : category ? "Save changes" : "Add category"}</button>
    </form>
  );
}

export function ConditionForm({ condition, categories, slugLocked }) {
  const [state, action, pending] = useActionState(saveCondition, null);
  const onSubmit = useKeepFields(action);
  return (
    <form method="post" onSubmit={onSubmit} className="card" style={{ padding: 16, maxWidth: 560 }}>
      {condition && <input type="hidden" name="id" value={condition.id} />}
      <Errors state={state} />
      <div className="field"><label htmlFor="name">Name</label>
        <input id="name" name="name" className="input" defaultValue={condition?.name} maxLength={80} required /></div>
      <div className="field"><label htmlFor="slug">URL slug</label>
        <input id="slug" name="slug" className="input" defaultValue={condition?.slug} disabled={slugLocked} placeholder="Leave blank to create from the name" />
        <span className="hint">
          {slugLocked
            ? "Locked because articles are linked to this condition."
            : "The page address will be /conditions/your-slug."}
        </span></div>
      <div className="field"><label htmlFor="categoryId">Category</label>
        <select id="categoryId" name="categoryId" className="select input" defaultValue={condition?.categoryId || ""} required>
          <option value="">Select a category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isActive ? "" : " (inactive)"}</option>)}
        </select></div>
      <div className="field"><label htmlFor="overview">Overview</label>
        <textarea id="overview" name="overview" className="textarea" style={{ minHeight: 140 }} defaultValue={condition?.overview} maxLength={1500} required />
        <span className="hint">20-1500 characters. Plain language, no diagnosis or treatment advice.</span></div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <input type="checkbox" name="isActive" defaultChecked={condition ? condition.isActive : true} /> Active (visible on the site)
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Saving..." : condition ? "Save changes" : "Add condition"}</button>
    </form>
  );
}
