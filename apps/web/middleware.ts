import { Tracker } from "@usenotra/geo";
import { next, waitUntil } from "@vercel/functions";

const geo = new Tracker({
  token: process.env.NOTRA_GEO_TOKEN ?? "",
  endpoint: "https://ingest.usenotra.com",
});

export default function middleware(request: Request) {
  waitUntil(geo.track(request));
  return next();
}
