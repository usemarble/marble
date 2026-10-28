import { Tracker } from "@usenotra/geo";
import { next } from "@vercel/functions";

const token = process.env.NOTRA_GEO_TOKEN ?? "";

if (!token) {
  console.error("NOTRA_GEO_TOKEN is missing");
}

const geo = new Tracker({
  token,
  endpoint: "https://ingest.usenotra.com",
  onError(error) {
    const status =
      error instanceof Error
        ? /^GEO ingest request failed \(HTTP (\d{3})\)$/.exec(
            error.message
          )?.[1]
        : undefined;

    console.error(
      "GEO tracking failed",
      status ? { status: Number(status) } : { failure: "network_failure" }
    );
  },
});

export default function middleware(
  request: Request,
  context: { waitUntil(promise: Promise<unknown>): void }
) {
  context.waitUntil(geo.track(request));
  return next();
}
