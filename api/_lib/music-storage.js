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

function assertSafeObjectKey(objectKey) {
  if (typeof objectKey !== "string" || objectKey.length < 8 || objectKey.length > 1024 ||
      objectKey.startsWith("/") || objectKey.includes("\\") || objectKey.includes("\0") ||
      !/^(artists|promotions)\/[A-Za-z0-9._/-]+$/.test(objectKey)) {
    throw new Error("Invalid Neon Storage object reference.");
  }
  const segments = objectKey.split("/");
  if (segments.some(segment => !segment || segment === "." || segment === "..")) {
    throw new Error("Invalid Neon Storage object reference.");
  }
  return objectKey;
}

function createPresignedUrl(method, objectKey, expiresIn = 3600) {
  assertSafeObjectKey(objectKey);
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
  const size = Number(response.headers.get("content-length") || 0);
  if (!Number.isSafeInteger(size) || size < 1) throw new Error("Uploaded file has an invalid stored size.");
  return { size, contentType: String(response.headers.get("content-type") || "").toLowerCase() };
}

// Read only a small prefix from storage. A HEAD Content-Type value is supplied
// by the uploader and is not proof of the file's actual format.
async function readObjectPrefix(objectKey, byteCount = 32) {
  const url = createPresignedUrl("GET", objectKey, 60);
  const response = await fetch(url, { method: "GET", headers: { Range: `bytes=0-${byteCount - 1}` } });
  if (response.status !== 206) throw new Error("Storage could not provide a bounded file-signature check.");
  const contentRange = response.headers.get("content-range") || "";
  if (!/^bytes 0-\d+\/\d+$/.test(contentRange)) throw new Error("Storage returned an invalid bounded file range.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.length > byteCount) throw new Error("Uploaded file signature could not be verified.");
  return bytes;
}

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function detectImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return "image/png";
  if (bytes.length >= 12 && ascii(bytes,0,4) === "RIFF" && ascii(bytes,8,4) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && ascii(bytes,4,4) === "ftyp" && ["avif","avis"].includes(ascii(bytes,8,4))) return "image/avif";
  return null;
}

function detectAudioType(bytes) {
  if (bytes.length >= 3 && ascii(bytes,0,3) === "ID3") return "audio/mpeg";
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "audio/mpeg";
  if (bytes.length >= 12 && ascii(bytes,0,4) === "RIFF" && ascii(bytes,8,4) === "WAVE") return "audio/wav";
  if (bytes.length >= 4 && ascii(bytes,0,4) === "fLaC") return "audio/flac";
  if (bytes.length >= 4 && ascii(bytes,0,4) === "OggS") return "audio/ogg";
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0) return "audio/aac";
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "audio/webm";
  if (bytes.length >= 12 && ascii(bytes,4,4) === "ftyp") return "audio/mp4";
  return null;
}

function detectVideoType(bytes) {
  if (bytes.length >= 12 && ascii(bytes,4,4) === "ftyp") return "video/mp4";
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  return null;
}

export async function verifyMusicUpload(objectKey) {
  const result = await headObject(objectKey);
  if (result.size > 100 * 1024 * 1024) throw new Error("Uploaded audio file is empty or exceeds 100 MB.");
  const detected = detectAudioType(await readObjectPrefix(objectKey));
  const compatible = detected === "audio/mpeg" ? ["audio/mpeg"] :
    detected === "audio/wav" ? ["audio/wav","audio/x-wav"] :
    detected === "audio/flac" ? ["audio/flac"] :
    detected === "audio/ogg" ? ["audio/ogg"] :
    detected === "audio/aac" ? ["audio/aac"] :
    detected === "audio/webm" ? ["audio/webm"] :
    detected === "audio/mp4" ? ["audio/mp4"] : [];
  if (!detected || !compatible.includes(result.contentType)) throw new Error("The uploaded audio file content does not match its declared format.");
  return { ...result, detectedContentType: detected };
}

export async function verifyArtworkUpload(objectKey) {
  const result = await headObject(objectKey);
  if (result.size > 15 * 1024 * 1024) throw new Error("Artwork must be a non-empty image under 15 MB.");
  const detected = detectImageType(await readObjectPrefix(objectKey));
  if (!detected || detected !== result.contentType) throw new Error("Artwork content does not match its declared image format.");
  return { ...result, detectedContentType: detected };
}

export async function resolveMusicAssetUrl(value, expiresIn = 3600) {
  if (typeof value === "string" && value.startsWith("neon-storage:")) return createMusicDownloadUrl(value.slice("neon-storage:".length), expiresIn);
  if (typeof value === "string") { try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; } }
  return null;
}

export async function verifyPromotionVideoUpload(objectKey) {
  const result = await headObject(objectKey);
  if (result.size > 200 * 1024 * 1024) throw new Error("Promotion videos must be non-empty and under 200 MB.");
  const detected = detectVideoType(await readObjectPrefix(objectKey));
  if (!detected || (detected === "video/mp4" && !["video/mp4","video/quicktime"].includes(result.contentType)) || (detected === "video/webm" && result.contentType !== "video/webm")) {
    throw new Error("Promotion video content does not match its declared format.");
  }
  return { ...result, detectedContentType: detected };
}
