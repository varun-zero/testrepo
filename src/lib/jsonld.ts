/**
 * Serializes structured data for embedding in <script type="application/ld+json">.
 * JSON.stringify does not escape "</script>", so an admin-entered title or summary
 * containing that sequence would break out of the tag. Escaping "<" as \u003c
 * is JSON-equivalent and safe inside script contexts.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
