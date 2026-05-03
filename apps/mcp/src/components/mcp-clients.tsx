import type { Child } from "hono/jsx";
import {
  ClaudeIcon,
  CodexIcon,
  CursorIcon,
  GeminiIcon,
} from "@/components/icons";

export interface McpClient {
  Icon: (props: { class?: string }) => Child;
  id: string;
  name: string;
}

export const MCP_CLIENTS: McpClient[] = [
  {
    id: "cursor",
    name: "Cursor",
    Icon: CursorIcon,
  },
  {
    id: "claude-code",
    name: "Claude Code",
    Icon: ClaudeIcon,
  },
  {
    id: "codex",
    name: "Codex",
    Icon: CodexIcon,
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    Icon: GeminiIcon,
  },
];
