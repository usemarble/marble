import { describe, expect, it } from "vitest";
import {
  FIELD_WORKSPACE_KEY_UNIQUE_CONSTRAINT,
  isFieldWorkspaceKeyConflict,
  isPgSerializationFailure,
  isPgUniqueViolation,
} from "./pg-errors";

function postgresError(code: string, constraint?: string) {
  return Object.assign(new Error("Postgres error"), { code, constraint });
}

describe("Postgres error helpers", () => {
  it("recognizes a unique violation for the requested constraint", () => {
    const error = postgresError("23505", FIELD_WORKSPACE_KEY_UNIQUE_CONSTRAINT);

    expect(
      isPgUniqueViolation(error, FIELD_WORKSPACE_KEY_UNIQUE_CONSTRAINT)
    ).toBe(true);
    expect(isFieldWorkspaceKeyConflict(error)).toBe(true);
  });

  it("rejects unique violations for another constraint", () => {
    const error = postgresError("23505", "another_constraint");

    expect(isFieldWorkspaceKeyConflict(error)).toBe(false);
  });

  it("recognizes serialization failures", () => {
    expect(isPgSerializationFailure(postgresError("40001"))).toBe(true);
    expect(isPgSerializationFailure(postgresError("23505"))).toBe(false);
  });

  it("rejects values that are not Error instances", () => {
    expect(
      isPgUniqueViolation(
        { code: "23505", constraint: FIELD_WORKSPACE_KEY_UNIQUE_CONSTRAINT },
        FIELD_WORKSPACE_KEY_UNIQUE_CONSTRAINT
      )
    ).toBe(false);
    expect(isPgSerializationFailure(null)).toBe(false);
  });
});
