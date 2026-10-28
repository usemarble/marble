import { Tracker } from "@usenotra/geo";
import { next } from "@vercel/functions";

const geo = new Tracker({
  token: process.env.NOTRA_GEO_TOKEN ?? "",
  endpoint: "https://ingest.usenotra.com",
});

export default function middleware(
  request: Request,
  context: { waitUntil(promise: Promise<unknown>): void }
) {
  context.waitUntil(geo.track(request));
  return next();
}
