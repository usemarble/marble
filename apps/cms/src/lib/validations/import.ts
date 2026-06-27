import { z } from "zod";

export const MAX_IMPORT_SIZE = 4 * 1024 * 1024;
export const IMPORT_FORMAT_BY_EXTENSION = {
  ".md": "markdown",
  ".mdx": "markdown",
  ".zip": "markdown",
} as const;

function hasAllowedImportExtension(file: File) {
  const name = file.name.toLowerCase();
  return Object.keys(IMPORT_FORMAT_BY_EXTENSION).some((extension) =>
    name.endsWith(extension)
  );
}

export const importUrlSchema = z
  .string()
  .trim()
  .url("A valid import URL is required")
  .refine((value) => {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  }, "Import URL must use http or https");

export const importRequestSourceSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("file"),
    file: z
      .instanceof(File, { message: "Import file is required" })
      .refine(
        (file) => file.size <= MAX_IMPORT_SIZE,
        "Import file must be 4 MB or smaller"
      )
      .refine(
        hasAllowedImportExtension,
        "Import file must be a .md, .mdx, or .zip file"
      ),
  }),
  z.object({
    source: z.literal("url"),
    url: importUrlSchema,
  }),
]);

export type ImportRequestSource = z.infer<typeof importRequestSourceSchema>;
