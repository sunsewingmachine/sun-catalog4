/**
 * API route: deletes a single image from R2 by folder + filename.
 * Supports ForAll, ForGroup (bar image folders) and Items (product Etc images).
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getBarFolderListPrefix } from "@/lib/r2ListHelper";

type AllowedFolder = "ForAll" | "ForGroup" | "Items";
const ALLOWED_FOLDERS: AllowedFolder[] = ["ForAll", "ForGroup", "Items"];

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

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { folder, filename } = (await req.json()) as { folder?: string; filename?: string };

    if (!folder || !filename) {
      return NextResponse.json({ error: "folder and filename are required" }, { status: 400 });
    }
    if (!ALLOWED_FOLDERS.includes(folder as AllowedFolder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const r2 = buildR2Client();
    if (!r2) {
      return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
    }

    let key: string;
    if (folder === "Items") {
      const itemsPrefix = (process.env.NEXT_PUBLIC_CDN_IMAGE_PREFIX ?? "").replace(/^\//, "").replace(/\/$/, "");
      key = itemsPrefix ? `${itemsPrefix}/${filename}` : filename;
    } else {
      const prefix = getBarFolderListPrefix(folder as "ForAll" | "ForGroup");
      key = `${prefix}/${filename}`;
    }

    await r2.client.send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }));
    return NextResponse.json({ ok: true, deleted: key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
