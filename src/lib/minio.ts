import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "s3.nevaobjects.id",
  // endPoint: "s3.nevaobjects.id",
  // port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  accessKey: process.env.MINIO_ACCESS || "minioadmin",
  secretKey: process.env.MINIO_SECRET || "minioadmin",
  // useSSL: process.env.MINIO_USE_SSL === "true" || false,
  useSSL: true,
});

const bucketName = process.env.MINIO_BUCKET || "ngabsenyuk";

// Ensure the bucket exists
async function ensureBucketExists() {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, "us-east-1");
    console.log(`Bucket "${bucketName}" created.`);
  } else {
    console.log(`Bucket "${bucketName}" already exists.`);
  }
}

/**
 * Upload file to MinIO
 */
export async function uploadFile(
  fileName: string,
  file: File | Buffer,
  mimeType?: string
) {
  await ensureBucketExists();
  const buffer =
    file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  await minioClient.putObject(bucketName, fileName, buffer, buffer.length, {
    "Content-Type": mimeType || "application/octet-stream",
  });
  return fileName;
}

/**
 * Get file URL from MinIO
 */
export async function getFileUrl(fileName: string) {
  const url = await minioClient.presignedUrl(
    "GET",
    bucketName,
    fileName,
    24 * 60 * 60
  );
  // console.log("Presigned URL:", url);
  return url;
}


/**
 * Delete file from MinIO
 */
export async function deleteFile(fileName: string) {
  await ensureBucketExists();
  await minioClient.removeObject(bucketName, fileName);
  return true;
}