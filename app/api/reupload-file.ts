import { NextApiRequest, NextApiResponse } from "next";
import { reuploadFileWithNewName } from "@/lib/actions/file.actions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { fileId, newName } = req.body;
  if (!fileId || !newName) {
    res.status(400).json({ error: "Missing fileId or newName" });
    return;
  }

  const result = await reuploadFileWithNewName(fileId, newName);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
}
