/**
 * API route: uploads an image file to R2 under ForAll, ForGroup, or Items folder.
 * Accepts multipart/form-data with fields: folder (ForAll|ForGroup|Items), filename, file (Blob).
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getBarFolderListPrefix } from "@/lib/r2ListHelper";

type AllowedFolder = "ForAll" | "ForGroup" | "Items";
const ALLOWED_FOLDERS: AllowedFolder[] = ["ForAll", "ForGroup", "Items"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
/** Max upload size: 10 MB */
const MAX_BYTES = 10 * 1024 * 1024;

function buildR2Client(): { client: S3Client; bucket: string } | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() || process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const endpointOverride = process.env.R2_ENDPOINT_OVERRIDE?.trim();

  if (!accessKeyId || !secretAccessKey || !bucket) return null;
  const endpoint = endpointOverride || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
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
    const folder = formData.get("folder") as string | null;
    const filename = formData.get("filename") as string | null;
    const file = formData.get("file") as File | null;

    if (!folder || !filename || !file) {
      return NextResponse.json({ error: "folder, filename and file are required" }, { status: 400 });
    }
    if (!ALLOWED_FOLDERS.includes(folder as AllowedFolder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }

    const r2 = buildR2Client();
    if (!r2) {
      return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let key: string;
    if (folder === "Items") {
      const itemsPrefix = (process.env.NEXT_PUBLIC_CDN_IMAGE_PREFIX ?? "").replace(/^\//, "").replace(/\/$/, "");
      key = itemsPrefix ? `${itemsPrefix}/${filename}` : filename;
    } else {
      const prefix = getBarFolderListPrefix(folder as "ForAll" | "ForGroup");
      key = `${prefix}/${filename}`;
    }

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
