import { useState } from "react";
import axios from "axios";
import { aqApi } from "@/lib/axios/api";
import {
  FileUploadRequest,
  FileUploadResponse,
} from "@/app/api/v1/upload/route";

export const uploadFileToR2 = async (file: File): Promise<string> => {
  const response = await aqApi.post<FileUploadResponse, FileUploadRequest>(
    "/api/v1/upload",
    { filename: file.name, contentType: file.type },
  );

  if (!response.success) {
    throw new Error("Failed to get upload URL");
  }

  await axios.put(response.data.url, file, {
    headers: { "Content-Type": file.type },
  });

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
