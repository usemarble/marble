# Marble MCP

Remote Model Context Protocol server for Marble.

The Worker exposes Marble API operations as MCP tools for agents and editors
such as Cursor, Claude Code, Codex, and other MCP clients.

## Routes

- `GET /` - basic service metadata
- `GET /health` - health check
- `GET|POST /mcp` - MCP Streamable HTTP endpoint

## Local development

From the repository root:

```sh
pnpm --filter mcp dev
```

Wrangler will start the Worker locally, usually at:

```txt
http://localhost:8787
```

If that port is already in use, Wrangler may choose another port.

## Authentication

MCP clients must send a Marble API key using one of these headers:

```txt
Mcp-Marble-Api-Key: <key>
X-Marble-Api-Key: <key>
Authorization: Bearer <key>
```

The MCP server forwards the key to the Marble API.

## Client configuration

For clients that support remote Streamable HTTP MCP servers directly, use:

```txt
http://localhost:8787/mcp
```

For clients that require a local stdio command, use `mcp-remote`:

```json
{
  "command": "npx",
  "args": [
    "mcp-remote",
    "http://localhost:8787/mcp",
    "--header",
    "Mcp-Marble-Api-Key:${MCP_MARBLE_API_KEY}"
  ],
  "env": {
    "MCP_MARBLE_API_KEY": "<your-api-key>"
  }
}
```

## Tools

The server currently exposes tools for:

- Posts: list, search, get, create, update, delete
- Categories: list, get, create, update, delete
- Tags: list, get, create, update, delete
- Authors: list, get, create, update, delete

Write operations require a private Marble API key.

## Verification

Typecheck the app:

```sh
pnpm --filter mcp exec tsc --noEmit
```

Deploy the Worker:

```sh
pnpm --filter mcp deploy
```
