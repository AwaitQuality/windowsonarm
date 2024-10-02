import { NextRequest } from "next/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { auth } from "@clerk/nextjs/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "edge";

export interface FileUploadRequest {
  filename: string;
  contentType: string;
}

export interface FileUploadResponse {
  url: string;
  fields: Record<string, string>;
  downloadUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = auth().userId;

    if (!userId) {
      return ErrorResponse.json("User not authorized");
    }

    const { env } = getRequestContext();
    const { filename, contentType } =
      (await request.json()) as FileUploadRequest;

    if (!filename || !contentType) {
      return ErrorResponse.json("Filename and content type are required");
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const key = `uploads/${userId}/${Date.now()}-${filename}`;

    const putObjectCommand = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return DataResponse.json({
      url: signedUrl,
      fields: {}, // R2 doesn't require additional fields like S3 does
      downloadUrl: publicUrl,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return ErrorResponse.json(error.message);
  }
}
