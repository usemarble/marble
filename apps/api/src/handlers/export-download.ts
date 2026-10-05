import {
  DataTransferError,
  getExportDownloadByToken,
} from "@marble/api/services/data-transfer";
import type { Handler } from "hono";
import type { DbVariables } from "../lib/db";
import type { Env } from "../types/env";

/**
 * The export-ready email's link. It redirects to a short-lived R2 URL once the
 * token checks out, so neither the link nor the file needs a session.
 */
export const exportDownload: Handler<{
  Bindings: Env;
  Variables: DbVariables;
}> = async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Invalid download token" }, 403);
  }
  try {
    const { url } = await getExportDownloadByToken(
      { db: c.get("db"), env: c.env },
      c.req.param("id") ?? "",
      token
    );
    c.header("cache-control", "no-store");
    return c.redirect(url, 302);
  } catch (error) {
    if (error instanceof DataTransferError) {
      return c.json({ error: error.message }, error.status);
    }
    throw error;
  }
};
