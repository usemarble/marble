import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

const ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME;
const ENDPOINT = process.env.CLOUDFLARE_S3_ENDPOINT;
const PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL;

if (
  !ACCESS_KEY_ID ||
  !SECRET_ACCESS_KEY ||
  !BUCKET_NAME ||
  !ENDPOINT ||
  !PUBLIC_URL
) {
  throw new Error("Missing Cloudflare R2 environment variables");
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET_NAME = BUCKET_NAME;
export const R2_PUBLIC_URL = PUBLIC_URL;
