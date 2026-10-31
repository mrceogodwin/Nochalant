import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const required = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_ENDPOINT_URL_S3", "AWS_REGION", "NEON_STORAGE_BUCKET"];
export function getMusicStorage() {
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) throw new Error("Music storage is not configured.");
  const client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    requestChecksumCalculation: "WHEN_REQUIRED"
  });
  return { client, bucket: process.env.NEON_STORAGE_BUCKET };
}

export async function createMusicUploadUrl(objectKey, contentType) {
  const { client, bucket } = getMusicStorage();
  const command = new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: contentType });
  const url = await getSignedUrl(client, command, { expiresIn: 300 });
  return { url, method: "PUT", headers: { "Content-Type": contentType }, expiresIn: 300 };
}

export async function createMusicDownloadUrl(objectKey, expiresIn = 3600) {
  const { client, bucket } = getMusicStorage();
  const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
  return getSignedUrl(client, command, { expiresIn });
}

export async function verifyMusicUpload(objectKey) {
  const { client, bucket } = getMusicStorage();
  const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
  const size = Number(result.ContentLength || 0);
  if (!size || size > 100 * 1024 * 1024) throw new Error("Uploaded audio file is empty or exceeds 100 MB.");
  return { size, contentType: result.ContentType || null };
}

export async function resolveMusicAssetUrl(value, expiresIn = 3600) {
  if (typeof value === "string" && value.startsWith("neon-storage:")) {
    return createMusicDownloadUrl(value.slice("neon-storage:".length), expiresIn);
  }
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.toString() : null;
    } catch { return null; }
  }
  return null;
}

export async function verifyArtworkUpload(objectKey) {
  const { client, bucket } = getMusicStorage();
  const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
  const size = Number(result.ContentLength || 0);
  const type = String(result.ContentType || "").toLowerCase();
  if (!size || size > 15 * 1024 * 1024) throw new Error("Artwork must be a non-empty image under 15 MB.");
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(type)) throw new Error("Artwork must be JPEG, PNG, WebP or AVIF.");
  return { size, contentType: type };
}
