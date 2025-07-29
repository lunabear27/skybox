// app/api/proxy-download/route.ts
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  const inline = searchParams.get("inline") === "1";

  if (!fileId) {
    return new Response(JSON.stringify({ error: "Missing fileId" }), {
      status: 400,
    });
  }

  try {
    const { databases, storage } = await createAdminClient();
    const fileDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      "files",
      fileId
    );
    if (!fileDoc) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
      });
    }
    const storageId = fileDoc.storageId;
    if (!storageId) {
      return new Response(
        JSON.stringify({ error: "File storageId not found" }),
        { status: 404 }
      );
    }
    let fileName = fileDoc.name || "downloaded-file";
    const mimeType = fileDoc.mimeType || "application/octet-stream";
    fileName = fileName.replace(/[^a-zA-Z0-9._\-()\[\] ]/g, "_");
    if (!fileName.includes(".")) {
      const ext = mimeType.split("/")[1];
      if (ext) fileName += `.${ext}`;
    }

    const fileResponse = await storage.getFileView(
      appwriteConfig.bucketId,
      storageId
    );
    let buffer;
    if (Buffer.isBuffer(fileResponse)) {
      buffer = fileResponse;
    } else if (fileResponse instanceof ArrayBuffer) {
      buffer = Buffer.from(fileResponse);
    } else {
      throw new Error("Unknown fileResponse type from getFileView");
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${
          inline ? "inline" : "attachment"
        }; filename=\"${fileName}\"; filename*=UTF-8''${encodeURIComponent(
          fileName
        )}`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "File not found or could not be downloaded" }),
      { status: 404 }
    );
  }
}
