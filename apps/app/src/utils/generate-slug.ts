export function generateSlug(title: string) {
  const slug = title
    .trim() // Remove leading and trailing spaces
    .toLowerCase() // convert all alphabets to lowercase
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-_]/g, "") // Remove all non-alphanumeric characters except hyphens and underscores
    .replace(/-+/g, "-"); // Replace multiple hyphens with a single hyphen

  return slug;
}
