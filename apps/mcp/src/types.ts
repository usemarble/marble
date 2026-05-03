export interface Env {
  MARBLE_API_BASE_URL?: string;
}

export type QueryParams = Record<
  string,
  boolean | number | string | string[] | undefined
>;
