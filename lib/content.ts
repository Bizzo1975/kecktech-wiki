import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "strong", "em", "u", "s",
    "a", "table", "thead", "tbody", "tr", "th", "td"
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    "*": []
  },
  allowedSchemes: ["http", "https", "mailto"]
};

export function sanitizeArticleHtml(input: string): string {
  return sanitizeHtml(input, sanitizeOptions);
}

export function markdownToSanitizedHtml(markdown: string): string {
  const raw = marked.parse(markdown, { breaks: true, gfm: true });
  const html = typeof raw === "string" ? raw : String(raw);
  return sanitizeArticleHtml(html);
}
