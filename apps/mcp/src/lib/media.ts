const MAX_REMOTE_MEDIA_BYTES = 5 * 1024 * 1024;
const REMOTE_MEDIA_FETCH_TIMEOUT_MS = 10_000;

export function filenameFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").filter(Boolean).at(-1);
    return filename || "media-upload";
  } catch {
    return "media-upload";
  }
}

export function assertPrivateApiKey(apiKey: string) {
  if (!rawApiKey(apiKey).startsWith("msk")) {
    throw new Error(
      "upload_media_from_url requires a private Marble API key (msk_...)."
    );
  }
}

export async function fetchRemoteMedia(url: string) {
  const remoteUrl = new URL(url);
  assertAllowedRemoteUrl(remoteUrl);

  const response = await fetch(remoteUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(REMOTE_MEDIA_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch media URL: ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength > MAX_REMOTE_MEDIA_BYTES) {
    throw new Error("Remote media files are limited to 5 MiB.");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return response.blob();
  }

  let receivedBytes = 0;
  const chunks: ArrayBuffer[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_REMOTE_MEDIA_BYTES) {
      await reader.cancel();
      throw new Error("Remote media files are limited to 5 MiB.");
    }

    chunks.push(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
    );
  }

  return new Blob(chunks, {
    type: response.headers.get("content-type") ?? undefined,
  });
}

function rawApiKey(apiKey: string) {
  return apiKey.replace(/^Bearer\s+/i, "").trim();
}

function assertAllowedRemoteUrl(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Remote media URL must use HTTP or HTTPS.");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.")
  ) {
    throw new Error("Remote media URL cannot target a private host.");
  }

  const ipv4Match = /^172\.(\d{1,3})\./.exec(hostname);
  if (ipv4Match) {
    const secondOctet = Number(ipv4Match[1]);
    if (secondOctet >= 16 && secondOctet <= 31) {
      throw new Error("Remote media URL cannot target a private host.");
    }
  }
}
