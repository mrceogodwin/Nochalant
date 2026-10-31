import { createHmac, createHash } from "node:crypto";

const required = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_ENDPOINT_URL_S3", "AWS_REGION", "NEON_STORAGE_BUCKET"];
const awsEncode = value => encodeURIComponent(value).replace(/[!'()*]/g, char => "%" + char.charCodeAt(0).toString(16).toUpperCase());
const hmac = (key, value, encoding) => createHmac("sha256", key).update(value).digest(encoding);
const sha256 = value => createHash("sha256").update(value).digest("hex");

function getMusicStorage() {
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) throw new Error("Music storage is not configured.");
  const endpoint = new URL(process.env.AWS_ENDPOINT_URL_S3);
  return { endpoint, bucket: process.env.NEON_STORAGE_BUCKET, region: process.env.AWS_REGION, accessKey: process.env.AWS_ACCESS_KEY_ID, secretKey: process.env.AWS_SECRET_ACCESS_KEY };
}

function createPresignedUrl(method, objectKey, expiresIn = 3600) {
  const { endpoint, bucket, region, accessKey, secretKey } = getMusicStorage();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = endpoint.host;
  const basePath = endpoint.pathname.replace(/\/$/, "");
  const canonicalUri = basePath + "/" + awsEncode(bucket) + "/" + objectKey.split("/").map(awsEncode).join("/");
  const scope = dateStamp + "/" + region + "/s3/aws4_request";
  const params = { "X-Amz-Algorithm": "AWS4-HMAC-SHA256", "X-Amz-Credential": accessKey + "/" + scope, "X-Amz-Date": amzDate, "X-Amz-Expires": String(expiresIn), "X-Amz-SignedHeaders": "host" };
  const canonicalQuery = Object.entries(params).map(([key, value]) => [awsEncode(key), awsEncode(value)]).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => key + "=" + value).join("&");
  const canonicalRequest = [method, canonicalUri, canonicalQuery, "host:" + host, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const dateKey = hmac("AWS4" + secretKey, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = hmac(signingKey, stringToSign, "hex");
  const url = new URL(endpoint.toString());
  url.pathname = canonicalUri;
  url.search = canonicalQuery + "&X-Amz-Signature=" + signature;
  return url.toString();
}

export async function createMusicUploadUrl(objectKey, contentType) {
  return { url: createPresignedUrl("PUT", objectKey, 300), method: "PUT", headers: { "Content-Type": contentType }, expiresIn: 300 };
}

export async function createMusicDownloadUrl(objectKey, expiresIn = 3600) {
  return createPresignedUrl("GET", objectKey, expiresIn);
}

async function headObject(objectKey) {
  const url = createPresignedUrl("HEAD", objectKey, 60);
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) throw new Error("Uploaded file could not be verified in Neon Storage.");
  return { size: Number(response.headers.get("content-length") || 0), contentType: String(response.headers.get("content-type") || "").toLowerCase() };
}

export async function verifyMusicUpload(objectKey) {
  const result = await headObject(objectKey);
  if (!result.size || result.size > 100 * 1024 * 1024) throw new Error("Uploaded audio file is empty or exceeds 100 MB.");
  if (!result.contentType.startsWith("audio/")) throw new Error("The uploaded file is not recognised as audio.");
  return result;
}

export async function verifyArtworkUpload(objectKey) {
  const result = await headObject(objectKey);
  if (!result.size || result.size > 15 * 1024 * 1024) throw new Error("Artwork must be a non-empty image under 15 MB.");
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(result.contentType)) throw new Error("Artwork must be JPEG, PNG, WebP or AVIF.");
  return result;
}

export async function resolveMusicAssetUrl(value, expiresIn = 3600) {
  if (typeof value === "string" && value.startsWith("neon-storage:")) return createMusicDownloadUrl(value.slice("neon-storage:".length), expiresIn);
  if (typeof value === "string") { try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; } }
  return null;
}
