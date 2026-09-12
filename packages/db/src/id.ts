import { createId } from "@paralleldrive/cuid2";

/** Generates a collision-resistant identifier for database records. */
export const createRecordId = (): string => createId();
