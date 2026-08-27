/**
 * Parity helpers for comparing Prisma vs Drizzle query results.
 *
 * These stubs normalize values so golden-path diffs ignore cosmetic
 * differences (Date serialization, array order) when DATABASE_URL is available.
 */

/** Convert Date instances (and nested ones) to ISO strings for stable JSON diffs. */
export function datesToIso<T>(value: T): T {
  if (value instanceof Date) {
    return value.toISOString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => datesToIso(item)) as T;
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>
    )) {
      out[key] = datesToIso(nested);
    }
    return out as T;
  }

  return value;
}

interface WithId {
  id: string;
}

/** Sort arrays of objects that have an `id` field for order-insensitive compare. */
export function sortById<T extends WithId>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.id.localeCompare(b.id));
}

/** Normalize a list of records: ISO dates + sort by id. */
export function normalizeRows<T extends WithId>(rows: T[]): T[] {
  return sortById(datesToIso(rows));
}
