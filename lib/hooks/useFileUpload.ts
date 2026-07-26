import { useState } from "react";
import { aqApi } from "@/lib/http/client";
import {
  ALLOWED_CONTENT_TYPES,
  FileUploadRequest,
  FileUploadResponse,
  MAX_UPLOAD_BYTES,
} from "@/lib/schemas/upload";

/** Narrows the browser's `string` MIME type to the types the API accepts. */
const isAllowedType = (
  type: string
): type is FileUploadRequest["contentType"] =>
  (ALLOWED_CONTENT_TYPES as readonly string[]).includes(type);

export const uploadFileToR2 = async (file: File): Promise<string> => {
  // Reject locally with a message the user can act on, instead of surfacing the
  // 400 the upload route returns for a disallowed type or an oversized file.
  if (!isAllowedType(file.type)) {
    throw new Error(
      `Unsupported file type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const maxMb = Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024));
    throw new Error(`File is too large. Maximum size is ${maxMb} MB`);
  }

  const response = await aqApi.post<FileUploadResponse, FileUploadRequest>(
    "/api/v1/upload",
    { contentType: file.type, size: file.size }
  );

  if (!response.success) {
    throw new Error(response.error || "Failed to get upload URL");
  }

  const upload = await fetch(response.data.url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!upload.ok) {
    throw new Error(`Upload failed with status ${upload.status}`);
  }

  return response.data.downloadUrl;
};

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const upload = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    return uploadFileToR2(selectedFile);
  };

  return { selectedFile, setSelectedFile, upload };
};
