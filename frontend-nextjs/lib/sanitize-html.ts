import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
] as const;

const ALLOWED_ATTR = [
  "alt",
  "aria-label",
  "colspan",
  "height",
  "href",
  "loading",
  "rel",
  "rowspan",
  "src",
  "target",
  "title",
  "width",
] as const;

export function sanitizeHtml(html?: string | null, fallback = "") {
  const source = html?.trim() ? html : fallback;

  return DOMPurify.sanitize(source, {
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style"],
    FORBID_TAGS: ["button", "embed", "form", "iframe", "input", "object", "script", "style"],
  });
}
