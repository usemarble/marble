export function generateSlug(
  text: string,
  { trimEdges = true }: { trimEdges?: boolean } = {}
) {
  const slug = (trimEdges ? text.trim() : text)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") // Allow lowercase letters, digits, and hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(trimEdges ? /^-+|-+$/g : /$^/g, "");

  return slug;
}
