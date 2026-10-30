import { env } from "cloudflare:workers";
import { publishDuePosts } from "@marble/api/services/scheduled-posts";
import { createDbClient } from "@/lib/db";

export async function handleScheduledPosts() {
  const db = await createDbClient();
  const { published, failed } = await publishDuePosts({
    db,
    env,
    queues: { events: env.EVENT_QUEUE },
  });

  if (published > 0 || failed > 0) {
    console.log(`[Scheduled posts] Published ${published}, failed ${failed}`);
  }
}
