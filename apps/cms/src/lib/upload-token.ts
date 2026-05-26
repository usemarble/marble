import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "v1";
const TOKEN_TTL_SECONDS = 10 * 60;

interface UploadTokenPayload {
  exp: number;
  key: string;
  type: "avatar" | "logo" | "media";
  workspaceId: string;
}

function getUploadTokenSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("Missing upload token secret");
  }

  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(data: string) {
  return createHmac("sha256", getUploadTokenSecret())
    .update(data)
    .digest("base64url");
}

export function createUploadToken(
  payload: Omit<UploadTokenPayload, "exp">
): string {
  const fullPayload: UploadTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(fullPayload));
  const signedData = `${TOKEN_VERSION}.${encodedPayload}`;
  return `${signedData}.${sign(signedData)}`;
}

export function verifyUploadToken(token: string): UploadTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid upload token");
  }

  const [version, encodedPayload, signature] = parts;
  if (version !== TOKEN_VERSION || !encodedPayload || !signature) {
    throw new Error("Invalid upload token");
  }

  const signedData = `${version}.${encodedPayload}`;
  const expectedSignature = sign(signedData);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new Error("Invalid upload token");
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as unknown;

  if (
    !payload ||
    typeof payload !== "object" ||
    !("exp" in payload) ||
    !("key" in payload) ||
    !("type" in payload) ||
    !("workspaceId" in payload)
  ) {
    throw new Error("Invalid upload token");
  }

  const typedPayload = payload as UploadTokenPayload;
  if (
    typeof typedPayload.exp !== "number" ||
    typeof typedPayload.key !== "string" ||
    !["avatar", "logo", "media"].includes(typedPayload.type) ||
    typeof typedPayload.workspaceId !== "string"
  ) {
    throw new Error("Invalid upload token");
  }

  if (typedPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Upload token expired");
  }

  return typedPayload;
}
