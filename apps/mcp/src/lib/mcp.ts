/**
 * Returns both human-readable text and structured data for MCP clients.
 * Structured content gives capable clients a stable object to inspect, while
 * the text fallback keeps the result useful everywhere.
 */
export function toolResult(data: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
