const BLOCKED_HOSTNAMES = new Set(["localhost"]);

function parseIPv4(hostname: string) {
  const parts = hostname.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const bytes = parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      return null;
    }

    const value = Number(part);
    return value >= 0 && value <= 255 ? value : null;
  });

  if (bytes.some((byte) => byte === null)) {
    return null;
  }

  return bytes as [number, number, number, number];
}

function isPrivateIPv4(hostname: string) {
  const bytes = parseIPv4(hostname);

  if (!bytes) {
    return false;
  }

  const [first, second] = bytes;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function normalizeIPv6(hostname: string) {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

function isPrivateIPv6(hostname: string) {
  const value = normalizeIPv6(hostname);

  return (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb") ||
    value.startsWith("ff") ||
    value.startsWith("::ffff:")
  );
}

function isBlockedHostname(hostname: string) {
  const value = hostname.toLowerCase();

  return (
    BLOCKED_HOSTNAMES.has(value) ||
    value.endsWith(".localhost") ||
    value.endsWith(".local") ||
    value.endsWith(".internal")
  );
}

export function isSafeWebhookUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();

    if (url.protocol !== "https:") {
      return false;
    }

    if (isBlockedHostname(hostname)) {
      return false;
    }

    if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
