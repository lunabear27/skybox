import { Metadata } from "next";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fileId: string }>;
}): Promise<Metadata> {
  try {
    const { databases } = await createAdminClient();
    const resolvedParams = await params;
    const fileDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      "files",
      resolvedParams.fileId
    );
    return {
      title: fileDoc?.name || "File Preview",
    };
  } catch {
    return { title: "File Preview" };
  }
}

export default async function FilePreviewPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const resolvedParams = await params;
  const fileUrl = `/api/proxy-download?fileId=${resolvedParams.fileId}&inline=1`;
  return (
    <iframe
      src={fileUrl}
      title="File Preview"
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        margin: 0,
        padding: 0,
        display: "block",
      }}
    />
  );
}
