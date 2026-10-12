"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { saveArticle } from "@/app/actions/articles";
import { LIMITS } from "@/lib/constants";
import { youTubeShortUrl } from "@/lib/video";
import { uploadImage } from "@/lib/uploadClient";
import CoverUpload from "./CoverUpload";

const escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TOOLS = [
  ["Bold", "bold", null, "B"],
  ["Italic", "italic", null, "I"],
  ["Heading 2", "formatBlock", "h2", "H2"],
  ["Heading 3", "formatBlock", "h3", "H3"],
  ["Paragraph", "formatBlock", "p", "P"],
  ["Bulleted list", "insertUnorderedList", null, "List"],
  ["Numbered list", "insertOrderedList", null, "1."],
  ["Quote", "formatBlock", "blockquote", "Quote"],
];

function RichText({ initial, disabled, onChange }) {
  const ref = useRef(null);
  const run = (cmd, val) => {
    if (disabled) return;
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(ref.current.innerHTML);
  };
  const addLink = () => {
    const url = window.prompt("Link address (https://...)");
    if (url && /^https?:\/\//i.test(url)) run("createLink", url);
  };
  const imgInput = useRef(null);
  const [imgError, setImgError] = useState("");
  const addImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const alt = window.prompt("Describe this image for readers who can't see it (alt text)");
    if (!alt?.trim()) {
      setImgError("Image not added: alt text is required.");
      return;
    }
    setImgError("");
    try {
      const { url } = await uploadImage(file);
      run("insertHTML", `<img src="${url}" alt="${escAttr(alt.trim().slice(0, 125))}">`);
    } catch (err) {
      setImgError(err.message);
    }
  };
  return (
    <div>
      {!disabled && (
        <div role="toolbar" aria-label="Formatting" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {TOOLS.map(([label, cmd, val, short]) => (
            <button key={label} type="button" className="btn btn-secondary btn-sm" aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={() => run(cmd, val)}>{short}</button>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onMouseDown={(e) => e.preventDefault()} onClick={addLink}>Link</button>
          <input ref={imgInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={addImage} hidden aria-label="Choose image to insert" />
          <button type="button" className="btn btn-secondary btn-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => imgInput.current?.click()}>Image</button>
        </div>
      )}
      {imgError && <p className="errmsg" role="alert" style={{ marginBottom: 8 }}>{imgError}</p>}
      <div
        ref={ref}
        className="input prose"
        style={{ minHeight: 320, font: "17px/1.7 var(--font-serif)", opacity: disabled ? 0.8 : 1 }}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article body"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: initial }}
      />
    </div>
  );
}

export default function ArticleEditor({ article, categories, conditions, isAdmin, readOnly = false }) {
  const [state, action, pending] = useActionState(saveArticle, null);
  const [body, setBody] = useState(article?.body || "");
  const [sources, setSources] = useState(
    article?.sources?.length ? article.sources.map(({ title, publisher, url, publishedYear }) => ({ title, publisher, url, publishedYear: publishedYear ?? "" })) : [{ title: "", publisher: "", url: "", publishedYear: "" }],
  );
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [cover, setCover] = useState(article?.coverImageUrl || "");
  const upd = (i, k, v) => setSources(sources.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const d = readOnly;
  const canSubmit = !article || article.status === "draft" || article.status === "changes_requested";

  // Submitting through a transition (instead of the form `action` prop) stops React 19 from
  // clearing the fields when the server returns validation errors.
  const onSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget, e.nativeEvent.submitter);
    startTransition(() => action(data));
  };

  return (
    <form method="post" onSubmit={onSubmit}>
      {article && <input type="hidden" name="id" value={article.id} />}
      <input type="hidden" name="body" value={body} />
      <input type="hidden" name="sources" value={JSON.stringify(sources.filter((s) => s.title || s.url || s.publisher))} />

      {state?.errors?.length > 0 && (
        <div className="alert alert-bad" role="alert" style={{ marginBottom: 16 }}>
          <b>Please fix:</b>
          <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <div className="editor-grid">
        <div style={{ minWidth: 0 }}>
          <div className="field"><label htmlFor="title">Title</label>
            <input id="title" name="title" className="input" defaultValue={article?.title} disabled={d} maxLength={LIMITS.title.max} required />
            <span className="hint">{LIMITS.title.min}-{LIMITS.title.max} characters. Clear and plain-language.</span>
          </div>
          <div className="field"><label>Body</label><RichText initial={article?.body || ""} disabled={d} onChange={setBody} />
            <span className="hint">Use H2 for sections. Include a &ldquo;When to see a doctor&rdquo; section. No diagnoses or dosage advice.</span>
          </div>

          <fieldset style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16 }} disabled={d}>
            <legend style={{ fontWeight: 600, padding: "0 6px" }}>Sources (at least 1, https links only)</legend>
            {sources.map((s, i) => (
              <div key={i} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 12 }}>
                <input className="input" placeholder="Title" aria-label={`Source ${i + 1} title`} value={s.title} onChange={(e) => upd(i, "title", e.target.value)} />
                <input className="input" placeholder="Publisher (e.g. WHO)" aria-label={`Source ${i + 1} publisher`} value={s.publisher} onChange={(e) => upd(i, "publisher", e.target.value)} />
                <input className="input" placeholder="https://..." aria-label={`Source ${i + 1} link`} value={s.url} onChange={(e) => upd(i, "url", e.target.value)} />
                <input className="input" placeholder="Year" inputMode="numeric" aria-label={`Source ${i + 1} year`} value={s.publishedYear} onChange={(e) => upd(i, "publishedYear", e.target.value)} />
                {sources.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSources(sources.filter((_, j) => j !== i))}>Remove</button>}
              </div>
            ))}
            {sources.length < 20 && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSources([...sources, { title: "", publisher: "", url: "", publishedYear: "" }])}>Add source</button>}
          </fieldset>
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="field"><label htmlFor="categoryId">Category</label>
            <select id="categoryId" name="categoryId" className="select input" defaultValue={article?.categoryId || ""} disabled={d}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="conditionId">Condition (optional)</label>
            <select id="conditionId" name="conditionId" className="select input" defaultValue={article?.conditionId || ""} disabled={d}>
              <option value="">None</option>
              {conditions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="tags">Tags (comma separated, max {LIMITS.maxTags})</label>
            <input id="tags" name="tags" className="input" defaultValue={article?.tags?.map((t) => t.tag.name).join(", ")} disabled={d} />
          </div>
          <div className="field"><label htmlFor="excerpt">Excerpt ({excerpt.length}/{LIMITS.excerpt.max})</label>
            <textarea id="excerpt" name="excerpt" className="textarea" maxLength={LIMITS.excerpt.max} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} disabled={d} />
            <span className="hint">{LIMITS.excerpt.min}-{LIMITS.excerpt.max} characters.</span>
          </div>
          <div className="field"><span className="label">Cover image</span>
            <CoverUpload value={cover} onChange={setCover} disabled={d} />
          </div>
          <div className="field"><label htmlFor="coverImageAlt">Cover image alt text</label>
            <input id="coverImageAlt" name="coverImageAlt" className="input" defaultValue={article?.coverImageAlt || ""} disabled={d} maxLength={LIMITS.coverAlt} />
          </div>
          <div className="field"><label htmlFor="videoUrl">Video (optional YouTube link)</label>
            <input id="videoUrl" name="videoUrl" type="url" className="input" placeholder="https://youtu.be/..." defaultValue={article?.videoId ? youTubeShortUrl(article.videoId) : ""} disabled={d} maxLength={300} />
            <span className="hint">Shown as a click-to-play video under the article summary. Only YouTube links work.</span>
          </div>

          {isAdmin && (
            <fieldset style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16 }} disabled={d}>
              <legend style={{ fontWeight: 600, padding: "0 6px" }}>SEO and placement (admin)</legend>
              <div className="field"><label htmlFor="seoTitle">SEO title (max {LIMITS.seoTitle})</label><input id="seoTitle" name="seoTitle" className="input" defaultValue={article?.seoTitle || ""} maxLength={LIMITS.seoTitle} /></div>
              <div className="field"><label htmlFor="seoDescription">Meta description (max {LIMITS.seoDescription})</label><textarea id="seoDescription" name="seoDescription" className="textarea" defaultValue={article?.seoDescription || ""} maxLength={LIMITS.seoDescription} /></div>
              <div className="field"><label htmlFor="slug">URL slug{article?.publishedAt ? " (locked after publishing)" : ""}</label><input id="slug" name="slug" className="input" defaultValue={article?.slug || ""} disabled={!!article?.publishedAt} /></div>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="isFeatured" defaultChecked={article?.isFeatured} /> Feature on home page</label>
            </fieldset>
          )}
        </div>
      </div>

      {!readOnly && (
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" type="submit" name="intent" value="save" disabled={pending}>
            {canSubmit ? "Save draft" : "Save changes"}
          </button>
          {canSubmit && (
            <button className="btn btn-primary" type="submit" name="intent" value="submit" disabled={pending}>
              {isAdmin ? "Save and mark as submitted" : "Submit for review"}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
