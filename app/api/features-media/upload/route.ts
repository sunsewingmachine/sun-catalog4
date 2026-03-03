/**
 * API route: uploads an image or mp4 video to R2 under CatelogPicturesVideos/ folder.
 * Images: JPEG/PNG/WebP/GIF up to 10 MB. Videos: mp4 only up to 300 MB.
 * Accepts multipart/form-data with fields: filename (string), file (Blob).
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg"];
const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

function getFeatureMediaR2Prefix(): string {
  const explicit = process.env.NEXT_PUBLIC_CDN_FEATURES_PREFIX?.trim();
  return explicit || "CatelogPicturesVideos";
}

function buildR2Client(): { client: S3Client; bucket: string } | null {
  const accountId =
    process.env.R2_ACCOUNT_ID?.trim() || process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID?.trim() || process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const endpointOverride = process.env.R2_ENDPOINT_OVERRIDE?.trim();

  if (!accessKeyId || !secretAccessKey || !bucket) return null;
  const endpoint =
    endpointOverride || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  if (!endpoint) return null;

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return { client, bucket };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const filename = formData.get("filename") as string | null;
    const file = formData.get("file") as File | null;

    if (!filename || !file) {
      return NextResponse.json({ error: "filename and file are required" }, { status: 400 });
    }
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_MIME_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_MIME_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only JPG images or MP4 videos are accepted" },
        { status: 400 }
      );
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 10 MB)" }, { status: 400 });
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: "Video too large (max 300 MB)" }, { status: 400 });
    }

    const r2 = buildR2Client();
    if (!r2) {
      return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
    }

    const prefix = getFeatureMediaR2Prefix();
    const key = prefix ? `${prefix}/${filename}` : filename;
    const arrayBuffer = await file.arrayBuffer();

    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      })
    );

    return NextResponse.json({ ok: true, uploaded: key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
