// Client-side upload helper: uploads files directly to Vercel Blob from the browser.
// This bypasses the serverless function body size limit (4.5MB on Hobby plan).
// Falls back to server-side upload in dev mode (when BLOB_READ_WRITE_TOKEN is not set).
import { upload } from "@vercel/blob/client";

export interface UploadedBlob {
  url: string;       // Full public URL on Vercel Blob
  pathname: string;  // Path within the blob store
  size: number;
}

// Upload a file directly from the browser to Vercel Blob.
// Returns the public URL of the uploaded file.
export async function uploadToBlob(
  file: File,
  category: "data-sources" | "inclinometers" | "station-layouts",
  stationCode: string
): Promise<UploadedBlob> {
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const base = file.name.replace(ext, "").replace(/[^\w.-]+/g, "_");
  const pathname = `${category}/${stationCode}_${Date.now()}_${base}${ext}`;

  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload-handler",
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
  };
}
