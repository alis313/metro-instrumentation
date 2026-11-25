// File storage abstraction: uses Vercel Blob in production, local filesystem in dev.
import * as fs from "fs";
import * as path from "path";
import { put, del } from "@vercel/blob";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const HAS_BLOB_TOKEN = !!process.env.BLOB_READ_WRITE_TOKEN;

export interface StoredFile {
  path: string;     // URL (prod) or filesystem path (dev) - used to read the file back
  publicPath: string; // URL for serving to the browser (e.g. /inclinometers/foo.png)
  size: number;
}

// ─── Save a file ─────────────────────────────────────────────────────

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  category: "data-sources" | "inclinometers" | "station-layouts",
  stationCode: string
): Promise<StoredFile> {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^\w.-]+/g, "_");
  const uniqueName = `${stationCode}_${Date.now()}_${base}${ext}`;

  if (IS_PRODUCTION && HAS_BLOB_TOKEN) {
    // Upload to Vercel Blob from the server
    const blobPath = `${category}/${uniqueName}`;
    const blob = await put(blobPath, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: getContentType(ext),
    });
    return {
      path: blob.url,
      publicPath: blob.url,
      size: buffer.length,
    };
  }

  // Dev mode or no Blob token: save to local filesystem
  if (category === "station-layouts") {
    const dir = path.join(process.cwd(), "public", "station-layouts");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, uniqueName);
    fs.writeFileSync(filePath, buffer);
    return { path: filePath, publicPath: `/station-layouts/${uniqueName}`, size: buffer.length };
  } else if (category === "inclinometers") {
    const dir = path.join(process.cwd(), "public", "inclinometers");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, uniqueName);
    fs.writeFileSync(filePath, buffer);
    return { path: filePath, publicPath: `/inclinometers/${uniqueName}`, size: buffer.length };
  } else {
    const dir = path.join(process.cwd(), "upload", "data-sources");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, uniqueName);
    fs.writeFileSync(filePath, buffer);
    return { path: filePath, publicPath: filePath, size: buffer.length };
  }
}

// ─── Read a file (for Excel parsing) ─────────────────────────────────

export async function readFile(filePath: string): Promise<Buffer> {
  // If it starts with http, fetch it (Vercel Blob URL)
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`Failed to fetch ${filePath}: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  // Local filesystem
  return fs.readFileSync(filePath);
}

export function fileExists(filePath: string): boolean {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return true; // can't check synchronously, assume exists
  }
  return fs.existsSync(filePath);
}

// ─── Delete a file ───────────────────────────────────────────────────

export async function deleteFile(filePath: string): Promise<void> {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    if (HAS_BLOB_TOKEN) {
      try {
        await del(filePath);
      } catch (e) {
        console.warn("[blob] delete failed:", e);
      }
    }
    return;
  }
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn("[fs] delete failed:", e);
  }
}

// ─── Content type helper ─────────────────────────────────────────────

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}
