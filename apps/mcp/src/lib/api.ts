import type { QueryParams } from "@/types";
import { authHeaderValue } from "./auth";

/**
 * Builds a Marble API URL and serializes array query values using the comma
 * format expected by the existing API filters.
 */
function buildUrl(apiBaseUrl: string, path: string, query?: QueryParams) {
  const url = new URL(path, apiBaseUrl);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) {
      continue;
    }

    url.searchParams.set(
      key,
      Array.isArray(value) ? value.join(",") : String(value)
    );
  }

  return url;
}

/**
 * Calls the Marble API with the caller's API key and returns the parsed JSON
 * body. API failures are converted into MCP-friendly errors so agents can
 * recover or ask the user for the right fix.
 */
export async function readJsonApi(
  apiBaseUrl: string,
  apiKey: string,
  path: string,
  query?: QueryParams
) {
  return requestJsonApi(apiBaseUrl, apiKey, "GET", path, { query });
}

/**
 * Sends JSON to the Marble API with the caller's API key and returns the parsed
 * JSON body. Used by create/update tools that require private Marble API keys.
 */
export async function writeJsonApi(
  apiBaseUrl: string,
  apiKey: string,
  method: "PATCH" | "POST",
  path: string,
  body: Record<string, unknown>
) {
  return requestJsonApi(apiBaseUrl, apiKey, method, path, { body });
}

/**
 * Deletes a Marble API resource with the caller's API key and returns the
 * parsed JSON response.
 */
export async function deleteJsonApi(
  apiBaseUrl: string,
  apiKey: string,
  path: string
) {
  return requestJsonApi(apiBaseUrl, apiKey, "DELETE", path);
}

async function requestJsonApi(
  apiBaseUrl: string,
  apiKey: string,
  method: "DELETE" | "GET" | "PATCH" | "POST",
  path: string,
  options: {
    body?: Record<string, unknown>;
    query?: QueryParams;
  } = {}
) {
  const response = await fetch(buildUrl(apiBaseUrl, path, options.query), {
    method,
    headers: {
      Authorization: authHeaderValue(apiKey),
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      typeof body?.message === "string"
        ? body.message
        : typeof body?.error === "string"
          ? body.error
          : "The Marble API returned an error.";

    if (response.status === 401) {
      throw new Error(
        "The Marble API key is missing or invalid. Ask the user to check their MCP Marble API key."
      );
    }

    throw new Error(`Marble API ${response.status}: ${message}`);
  }

  return body as Record<string, unknown>;
}
