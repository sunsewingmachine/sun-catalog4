/**
 * Lists object keys from R2 (or S3-compatible) bucket by prefix. Used for ForAll/ForGroup bar images.
 * ForAll and ForGroup are listed under the same path as the items folder (optional path prefix).
 * Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME (optional: R2_ENDPOINT_OVERRIDE, NEXT_PUBLIC_CDN_BAR_PATH_PREFIX).
 */

import {
  S3Client,
  ListObjectsV2Command,
  type _Object,
} from "@aws-sdk/client-s3";

/** Path prefix where items/ForAll/ForGroup live. Uses NEXT_PUBLIC_CDN_BAR_PATH_PREFIX, or parent of NEXT_PUBLIC_CDN_IMAGE_PREFIX (e.g. "catalog/items" → "catalog"). */
export function getBarImagesPathPrefix(): string {
  const explicit = process.env.NEXT_PUBLIC_CDN_BAR_PATH_PREFIX;
  if (explicit && typeof explicit === "string") {
    return explicit.replace(/\/$/, "").replace(/^\//, "");
  }
  const itemsPrefix = process.env.NEXT_PUBLIC_CDN_IMAGE_PREFIX;
  if (!itemsPrefix || typeof itemsPrefix !== "string") return "";
  const parts = itemsPrefix.replace(/^\//, "").replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length < 2) return "";
  return parts.slice(0, -1).join("/");
}

function getR2Config(): {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
} | null {
  const accountId = (
    process.env.R2_ACCOUNT_ID?.trim() ||
    process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
  );
  const accessKeyId = (
    process.env.R2_ACCESS_KEY_ID?.trim() ||
    process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim()
  );
  const secretAccessKey = (
    process.env.R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim()
  );
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const endpointOverride = process.env.R2_ENDPOINT_OVERRIDE?.trim();

  if (!accessKeyId || !secretAccessKey || !bucket) return null;
  const endpoint =
    endpointOverride ||
    (accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : "");
  if (!endpoint) return null;

  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

/** True when R2/S3 env vars are set so the bar-images API can list ForAll/ForGroup. */
export function isR2ListConfigured(): boolean {
  return getR2Config() !== null;
}

/**
 * Lists object keys under the given prefix. Returns only the key suffix (filename) after the prefix.
 * E.g. prefix "ForAll/", key "ForAll/logo.png" → returns "logo.png".
 */
export async function listKeysByPrefix(
  prefix: string
): Promise<string[]> {
  const config = getR2Config();
  if (!config) return [];

  const client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });

  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: normalizedPrefix,
      ContinuationToken: continuationToken,
    });
    const response = await client.send(command);
    const contents = (response.Contents ?? []) as _Object[];
    for (const obj of contents) {
      const key = obj.Key;
      if (key && key.startsWith(normalizedPrefix)) {
        const suffix = key.slice(normalizedPrefix.length);
        if (suffix) keys.push(suffix);
      }
    }
    continuationToken = response.NextContinuationToken ?? undefined;
  } while (continuationToken);

  return keys;
}

/** Builds the bucket list prefix for ForAll or ForGroup (same path as items folder). */
export function getBarFolderListPrefix(folder: "ForAll" | "ForGroup"): string {
  const pathPrefix = getBarImagesPathPrefix();
  return pathPrefix ? `${pathPrefix}/${folder}` : folder;
}

/** Builds the bucket list prefix for testimonials (same path as ForAll/ForGroup). */
export function getTestimonialsFolderListPrefix(): string {
  const pathPrefix = getBarImagesPathPrefix();
  return pathPrefix ? `${pathPrefix}/testimonials` : "testimonials";
}
