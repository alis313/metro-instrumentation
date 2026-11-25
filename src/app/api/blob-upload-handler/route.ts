// Client-side Blob upload handler route
// Called by @vercel/blob/client's upload() function from the browser
// to get a client token for direct upload to Vercel Blob.
import { handleUpload } from "@vercel/blob/client";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    await requireAdmin();

    const body = await request.json();

    const jsonResponse = await handleUpload({
      body,
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });

    return Response.json(jsonResponse);
  } catch (err) {
    console.error("[blob-upload-handler] error:", err);

    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Return JSON even for errors so the client can parse the response
    return Response.json(
      { error: err instanceof Error ? err.message : "Blob upload handler error" },
      { status: 500 }
    );
  }
}
