import { NextRequest } from "next/server";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import DataResponse from "@/lib/backend/response/DataResponse";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@clerk/nextjs/server";
// Import polyfill before AWS SDK to provide DOMParser in Edge Runtime
import "@/lib/polyfills";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  EXTENSION_BY_CONTENT_TYPE,
  FileUploadResponse,
  uploadRequestSchema,
} from "@/lib/schemas/upload";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponse.json("Unauthorized", { status: 401 });
    }

    const parsed = uploadRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return ErrorResponse.json("Invalid upload request", { status: 400 });
    }

    const { contentType, size } = parsed.data;
    const { env } = await getCloudflareContext({ async: true });

    const s3Client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    // The key is fully server-derived: a client-supplied filename could contain
    // `../` and escape the per-user prefix.
    const key = `uploads/${userId}/${crypto.randomUUID()}.${EXTENSION_BY_CONTENT_TYPE[contentType]}`;

    const putObjectCommand = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      // Signed, so the PUT is bound to exactly this byte count and this type.
      ContentLength: size,
    });

    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return DataResponse.json<FileUploadResponse>({
      url: signedUrl,
      fields: {}, // R2 doesn't require additional fields like S3 does
      downloadUrl: publicUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return ErrorResponse.json("Failed to prepare upload");
  }
}
