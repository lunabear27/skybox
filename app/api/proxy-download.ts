import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { fileId } = req.query; // fileId is the database document ID

  if (!fileId) {
    console.error("[ProxyDownload] Missing fileId in query", req.query);
    res.status(400).json({ error: "Missing fileId" });
    return;
  }

  try {
    const { databases, storage } = await createAdminClient();
    console.log(`[ProxyDownload] Looking up fileId: ${fileId}`);
    // Get file metadata from your DB
    const fileDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      "files",
      fileId as string
    );
    if (!fileDoc) {
      console.error(
        `[ProxyDownload] File document not found for fileId: ${fileId}`
      );
      res.status(404).json({ error: "File not found" });
      return;
    }
    console.log(`[ProxyDownload] fileDoc:`, fileDoc);
    const storageId = fileDoc.storageId;
    if (!storageId) {
      console.error(
        `[ProxyDownload] No storageId in fileDoc for fileId: ${fileId}`,
        fileDoc
      );
      res.status(404).json({ error: "File storageId not found" });
      return;
    }
    let fileName = fileDoc.name || "downloaded-file";
    const mimeType = fileDoc.mimeType || "application/octet-stream";

    // Check for inline param to allow in-browser preview
    const inline = req.query.inline === "1";
    const dispositionType = inline ? "inline" : "attachment";

    // Sanitize filename for Content-Disposition (remove problematic characters)
    fileName = fileName.replace(/[^a-zA-Z0-9._\-()\[\] ]/g, "_");
    if (!fileName.includes(".")) {
      // Try to add extension from mimeType if missing
      const ext = mimeType.split("/")[1];
      if (ext) fileName += `.${ext}`;
    }
    console.log(`[ProxyDownload] Proxy download filename: ${fileName}`);
    console.log(`[ProxyDownload] Downloading from storageId: ${storageId}`);

    // Download file as buffer from storage
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
      console.error(
        `[ProxyDownload] Unknown fileResponse type from getFileView`,
        fileResponse
      );
      throw new Error("Unknown fileResponse type from getFileView");
    }

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(
        fileName
      )}`
    );
    res.setHeader("Content-Length", buffer.length);
    res.status(200).send(buffer);
  } catch (error) {
    console.error(
      `[ProxyDownload] Proxy download error for fileId: ${fileId}`,
      error
    );
    res
      .status(404)
      .json({ error: "File not found or could not be downloaded" });
  }
}
