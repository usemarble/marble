import {
  IMPORT_FORMAT_BY_EXTENSION,
  type ImportRequestSource,
  importRequestSourceSchema,
} from "@/lib/validations/import";

export type ImportFormat =
  (typeof IMPORT_FORMAT_BY_EXTENSION)[keyof typeof IMPORT_FORMAT_BY_EXTENSION];

export function serializeImportJob(job: {
  id: string;
  source: string;
  status: string;
  format: string | null;
  sourceUrl: string | null;
  totalItems: number;
  readyItems: number;
  errorItems: number;
  importedItems: number;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}) {
  return {
    id: job.id,
    source: job.source,
    status: job.status,
    format: job.format,
    sourceUrl: job.sourceUrl,
    totalItems: job.totalItems,
    readyItems: job.readyItems,
    errorItems: job.errorItems,
    importedItems: job.importedItems,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    failedAt: job.failedAt?.toISOString() ?? null,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
  };
}

export function getImportFormat(file: File): ImportFormat | null {
  const name = file.name.toLowerCase();
  const extension = Object.keys(IMPORT_FORMAT_BY_EXTENSION).find((ext) =>
    name.endsWith(ext)
  ) as keyof typeof IMPORT_FORMAT_BY_EXTENSION | undefined;

  return extension ? IMPORT_FORMAT_BY_EXTENSION[extension] : null;
}

export function getImportExtension(file: File) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".mdx")) {
    return "mdx";
  }

  if (name.endsWith(".zip")) {
    return "zip";
  }

  return "md";
}

export async function getImportRequestSource(
  request: Request
): Promise<ImportRequestSource | { error: string }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      url?: unknown;
    } | null;
    const parsed = importRequestSourceSchema.safeParse({
      source: "url",
      url: body?.url,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid import URL" };
    }

    return parsed.data;
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return { error: "Invalid import payload" };
  }

  const file = formData.get("file");
  const url = formData.get("url");

  if (file instanceof File && typeof url === "string" && url.trim()) {
    return { error: "Provide either an import file or URL, not both" };
  }

  if (file instanceof File) {
    const parsed = importRequestSourceSchema.safeParse({
      source: "file",
      file,
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Invalid import file",
      };
    }

    return parsed.data;
  }

  if (typeof url === "string" && url.trim()) {
    const parsed = importRequestSourceSchema.safeParse({
      source: "url",
      url,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid import URL" };
    }

    return parsed.data;
  }

  return { error: "Import file or URL is required" };
}
