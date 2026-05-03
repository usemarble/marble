import { Hono } from "hono";
import { MCP_CLIENTS } from "@/components/mcp-clients";
import { MCP_TOOL_GROUPS } from "@/lib/constants";
import type { Env } from "@/types";

export const homeRoute = new Hono<{ Bindings: Env }>();

homeRoute.get("/", (c) => {
  const requestUrl = new URL(c.req.url);
  const mcpHttpUrl = `${requestUrl.origin}/mcp`;

  return c.html(
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>Marble MCP</title>
        <meta
          content="Connect AI agents and MCP clients to your Marble workspace."
          name="description"
        />
        <meta content="Marble MCP" property="og:title" />
        <meta
          content="Connect AI agents and MCP clients to your Marble workspace."
          property="og:description"
        />
        <meta content="website" property="og:type" />
        <meta content={requestUrl.origin} property="og:url" />
        <meta content="/opengraph.png" property="og:image" />
        <meta content="summary_large_image" name="twitter:card" />
        <meta content="Marble MCP" name="twitter:title" />
        <meta
          content="Connect AI agents and MCP clients to your Marble workspace."
          name="twitter:description"
        />
        <meta content="/opengraph.png" name="twitter:image" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/styles.css" rel="stylesheet" />
      </head>
      <body>
        <main>
          <section class="heading">
            <div>
              <h1>Marble MCP</h1>
              <p>Connect AI agents and MCP clients to your Marble workspace.</p>
            </div>
            <a class="button" href="https://docs.marblecms.com/guides/mcp">
              Documentation
            </a>
          </section>
          <section class="server-section">
            <h2 class="section-heading">Server URL</h2>
            <div class="server-url">
              <code>{mcpHttpUrl}</code>
              <button data-copy={mcpHttpUrl} type="button">
                Copy
              </button>
            </div>
            <p>
              Configure your MCP client with Streamable HTTP and pass your
              Marble API key using the <code>Mcp-Marble-Api-Key</code> header.
            </p>
          </section>
          <section>
            <h2 class="section-heading">Works with</h2>
            <ul class="client-list">
              {MCP_CLIENTS.map((client) => (
                <li class="client-card" key={client.id}>
                  {client.Icon({
                    class:
                      client.id === "codex"
                        ? "client-icon-svg client-icon-codex"
                        : "client-icon-svg",
                  })}
                  <span>{client.name}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 class="section-heading">Available tools</h2>
            <div class="tool-groups">
              {MCP_TOOL_GROUPS.map((group) => (
                <details class="tool-group" key={group.name}>
                  <summary>
                    <span>
                      <span class="tool-group-name">{group.name}</span>
                      <small>{group.description}</small>
                    </span>
                    <span class="tool-count">{group.tools.length} tools</span>
                  </summary>
                  <ul class="tool-list">
                    {group.tools.map((tool) => (
                      <li class="tool-item" key={tool.name}>
                        <code>{tool.name}</code>
                        <span>{tool.description}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        </main>
        <footer class="site-footer">
          <p>© 2026 all rights reserved</p>
          <nav aria-label="Footer links">
            <a href="https://github.com/usemarble/marble">GitHub</a>
            <a href="https://marblecms.com?utm_source=mcp_home">Website</a>
          </nav>
        </footer>
        <script src="/home.js" type="module" />
      </body>
    </html>
  );
});
