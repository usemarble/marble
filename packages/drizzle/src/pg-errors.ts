const PG_UNIQUE_VIOLATION = "23505";
const PG_SERIALIZATION_FAILURE = "40001";

export const FIELD_WORKSPACE_KEY_UNIQUE_CONSTRAINT =
  "field_workspaceId_key_key";

type PgError = Error & {
  code?: string;
  constraint?: string;
};

function asPgError(error: unknown): PgError | null {
  if (!(error instanceof Error)) {
    return null;
  }

  return error as PgError;
}

export function isPgUniqueViolation(
  error: unknown,
  constraint: string
): boolean {
  const candidate = asPgError(error);
  if (!candidate) {
    return false;
  }

  return (
    candidate.code === PG_UNIQUE_VIOLATION &&
    candidate.constraint === constraint
  );
}

export function isPgSerializationFailure(error: unknown): boolean {
  const candidate = asPgError(error);
  return candidate?.code === PG_SERIALIZATION_FAILURE;
}

export function isFieldWorkspaceKeyConflict(error: unknown): boolean {
  return isPgUniqueViolation(error, FIELD_WORKSPACE_KEY_UNIQUE_CONSTRAINT);
}
