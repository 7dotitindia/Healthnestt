import { describe, it, expect } from "vitest";
import { slugify, readingTime, stripHtml, addMonths } from "@/lib/text";
import { cleanBody } from "@/lib/sanitize";
import { sniffImage, NAME_RE, mimeFor } from "@/lib/storage";
import { rateLimit } from "@/lib/rateLimit";
import { RESERVED_SLUGS } from "@/lib/taxonomy";

describe("slugify", () => {
  it("lowercases and hyphenates", () => expect(slugify("Type 2 Diabetes")).toBe("type-2-diabetes"));
  it("strips accents and symbols", () => expect(slugify("Café & Crème!!")).toBe("cafe-creme"));
  it("trims hyphens at the ends", () => expect(slugify("--Hello--")).toBe("hello"));
  it("caps the length without leaving a trailing hyphen", () => {
    const s = slugify("word ".repeat(40));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
  });
  it("returns an empty string when nothing usable remains", () => expect(slugify("!!!")).toBe(""));
});

describe("text helpers", () => {
  it("stripHtml removes tags", () => expect(stripHtml("<p>Hi <b>there</b></p>")).toBe("Hi there"));
  it("readingTime is at least one minute", () => expect(readingTime("<p>short</p>")).toBe(1));
  it("readingTime scales with length (200 words per minute)", () => {
    expect(readingTime(`<p>${"word ".repeat(1000)}</p>`)).toBe(5);
  });
  it("addMonths moves the date forward", () => {
    expect(addMonths(new Date("2026-01-15T00:00:00Z"), 12).getUTCFullYear()).toBe(2027);
  });
});

describe("cleanBody (HTML sanitizer)", () => {
  it("removes script tags and their content", () => {
    expect(cleanBody("<p>ok</p><script>alert(1)</script>")).toBe("<p>ok</p>");
  });
  it("removes inline event handlers", () => {
    expect(cleanBody('<p onclick="x()">hi</p>')).toBe("<p>hi</p>");
  });
  it("removes javascript: links", () => {
    expect(cleanBody('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });
  it("adds rel to links", () => {
    expect(cleanBody('<a href="https://who.int">x</a>')).toContain('rel="noopener noreferrer"');
  });
  it("removes iframes, forms and styles", () => {
    const out = cleanBody('<iframe src="https://evil.com"></iframe><form><input></form><style>p{}</style><p>ok</p>');
    expect(out).toBe("<p>ok</p>");
  });
  it("keeps images that come from our own uploads", () => {
    const img = '<img src="/uploads/0123456789abcdef0123456789abcdef.png" alt="ok">';
    expect(cleanBody(img)).toContain("/uploads/0123456789abcdef0123456789abcdef.png");
  });
  it.each([
    ["external image", '<img src="https://evil.com/pixel.png" alt="x">'],
    ["protocol-relative image", '<img src="//evil.com/p.png" alt="x">'],
    ["data URI image", '<img src="data:image/png;base64,AAAA" alt="x">'],
    ["path traversal", '<img src="/uploads/../../.env" alt="x">'],
    ["wrong extension", '<img src="/uploads/0123456789abcdef0123456789abcdef.svg" alt="x">'],
    ["short name", '<img src="/uploads/abc.png" alt="x">'],
  ])("strips an image with %s", (_n, html) => {
    expect(cleanBody(html)).not.toContain("<img");
  });
  it("keeps normal article structure", () => {
    const html = "<h2>Title</h2><p><strong>b</strong> <em>i</em></p><ul><li>a</li></ul><blockquote>q</blockquote>";
    expect(cleanBody(html)).toBe(html);
  });
});

describe("upload file type detection", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]);

  it("recognises real PNG, JPEG and WebP by content", () => {
    expect(sniffImage(png)).toBe("png");
    expect(sniffImage(jpg)).toBe("jpg");
    expect(sniffImage(webp)).toBe("webp");
  });
  it.each([
    ["a script", Buffer.from("<script>alert(1)</script>")],
    ["an SVG", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')],
    ["a GIF", Buffer.from("GIF89a" + "0".repeat(20))],
    ["an executable", Buffer.from("MZ" + "\0".repeat(30))],
    ["an empty/short file", Buffer.from([0x89, 0x50])],
    ["RIFF but not WebP (a WAV file)", Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WAVE")])],
  ])("rejects %s", (_n, buf) => expect(sniffImage(buf)).toBeNull());

  it("only accepts generated file names when serving", () => {
    expect(NAME_RE.test("0123456789abcdef0123456789abcdef.png")).toBe(true);
    for (const bad of ["../x.png", "a.png", "0123456789abcdef0123456789abcdef.svg", "0123456789ABCDEF0123456789ABCDEF.png", "0123456789abcdef0123456789abcdef.png/../x", "x/0123456789abcdef0123456789abcdef.png"]) {
      expect(NAME_RE.test(bad)).toBe(false);
    }
  });
  it("maps extensions to content types", () => {
    expect(mimeFor("a.png")).toBe("image/png");
    expect(mimeFor("a.jpg")).toBe("image/jpeg");
    expect(mimeFor("a.webp")).toBe("image/webp");
  });
});

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const key = `t-${Math.random()}`;
    const results = Array.from({ length: 5 }, () => rateLimit(key, 3, 60000));
    expect(results).toEqual([true, true, true, false, false]);
  });
  it("tracks keys separately", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    rateLimit(a, 1, 60000);
    expect(rateLimit(a, 1, 60000)).toBe(false);
    expect(rateLimit(b, 1, 60000)).toBe(true);
  });
  it("resets after the window passes", async () => {
    const key = `w-${Math.random()}`;
    rateLimit(key, 1, 20);
    expect(rateLimit(key, 1, 20)).toBe(false);
    await new Promise((r) => setTimeout(r, 40));
    expect(rateLimit(key, 1, 20)).toBe(true);
  });
});

describe("reserved category slugs", () => {
  it("covers every top-level route in the app", () => {
    for (const s of ["admin", "freelancer", "staff", "search", "tools", "conditions", "articles", "authors", "api", "uploads"]) {
      expect(RESERVED_SLUGS.has(s)).toBe(true);
    }
  });
});
