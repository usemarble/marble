import type { TaskMessage } from "@marble/events";

export async function enqueueTask(message: TaskMessage) {
  const apiUrl = process.env.MARBLE_API_URL;
  const systemSecret = process.env.SYSTEM_SECRET;

  if (!apiUrl || !systemSecret) {
    throw new Error("Missing MARBLE_API_URL or SYSTEM_SECRET");
  }

  const response = await fetch(`${apiUrl}/internal/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-System-Secret": systemSecret,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to enqueue ${message.type}: ${response.status} ${response.statusText}`
    );
  }
}
