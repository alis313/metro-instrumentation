// Client-side Blob upload handler route
// This route generates a token that lets the browser upload directly to Vercel Blob,
// bypassing the serverless function body size limit (4.5MB on Hobby plan).
import { handleUpload } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { IncomingMessage } from "http";

export const dynamic = "force-dynamic";

// POST /api/blob-upload-handler
// Called by @vercel/blob/client's upload() function from the browser
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const jsonResponse = await handleUpload({
      request: req as unknown as IncomingMessage,
      body,
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[blob-upload-handler] error:", err);
    return NextResponse.json({ error: "Blob upload handler error" }, { status: 500 });
  }
}
