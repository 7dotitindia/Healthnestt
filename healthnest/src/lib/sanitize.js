import sanitizeHtml from "sanitize-html";

// Allowed tags per spec section 10. Everything else is stripped on save.
export function cleanBody(html) {
  return sanitizeHtml(html || "", {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "strong", "em", "b", "i", "ul", "ol", "li",
      "a", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "img",
    ],
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
    // Images inside articles must be our own uploads, never external URLs.
    exclusiveFilter: (frame) => frame.tag === "img" && !/^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(frame.attribs.src || ""),
  });
}
