"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/uploadClient";

export default function CoverUpload({ value, onChange, disabled }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name="coverImageUrl" value={value || ""} />
      <div className="cover" style={{ borderRadius: "var(--r-sm)", border: "1px solid var(--border)", marginBottom: 8 }}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Cover preview" />
        ) : (
          <span style={{ fontSize: 14, fontFamily: "var(--font-sans)", fontWeight: 400 }}>No cover image yet</span>
        )}
      </div>
      {!disabled && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} hidden aria-label="Choose cover image" />
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? "Uploading..." : value ? "Replace image" : "Upload image"}
          </button>
          {value && !busy && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange("")}>Remove</button>}
        </div>
      )}
      {error && <p className="errmsg" role="alert" style={{ marginTop: 6 }}>{error}</p>}
      <span className="hint">JPEG, PNG or WebP, up to 4 MB. Use an image you have the right to publish.</span>
    </div>
  );
}
