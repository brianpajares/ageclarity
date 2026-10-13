import { createHash, createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(projectRoot, "spec", "drive_manifest.json"), "utf8"));
const MAX_FILE_BYTES = 32 * 1024 * 1024;
const DRIVE_API = "https://www.googleapis.com/drive/v3";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function relativePath(drivePath) {
  const prefix = "/Apps/ageclarity/";
  if (typeof drivePath !== "string" || !drivePath.startsWith(prefix)) {
    throw new Error("Manifest path is outside /Apps/ageclarity/.");
  }
  const value = drivePath.slice(prefix.length);
  if (!value || value.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Manifest contains an invalid path.");
  }
  return value;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function serviceAccountToken() {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (!encoded) fail("Drive sync is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 and GOOGLE_DRIVE_FOLDER_ID.");

  let account;
  try {
    account = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    fail("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 is not valid base64-encoded JSON.");
  }
  if (!account?.client_email || !account?.private_key) {
    fail("The service-account JSON is missing client_email or private_key.");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(account.private_key, "base64url")}`;

  let response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
  } catch {
    fail("Could not reach Google OAuth. Check the cloud environment network policy.");
  }
  if (!response.ok) fail(`Google OAuth rejected the service account (HTTP ${response.status}).`);

  const token = await response.json();
  if (!token.access_token) fail("Google OAuth did not return an access token.");
  return token.access_token;
}

async function driveRequest(token, endpoint, options = {}) {
  let response;
  try {
    const url = endpoint.startsWith("https://") ? endpoint : `${DRIVE_API}${endpoint}`;
    response = await fetch(url, {
      ...options,
      headers: { authorization: `Bearer ${token}`, ...options.headers },
    });
  } catch {
    fail("Could not reach the Google Drive API. Check the cloud environment network policy.");
  }
  if (!response.ok) fail(`Google Drive request failed (HTTP ${response.status}).`);
  return response.status === 204 ? null : response.json();
}

async function ensureFolder(token, parentId, name) {
  const query = new URLSearchParams({
    q: `name = '${name.replaceAll("'", "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id,name,mimeType)",
    pageSize: "100",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
  });
  const result = await driveRequest(token, `/files?${query}`);
  if (result.nextPageToken) fail("Drive folder contains too many matches to select safely.");
  if (result.files?.length > 1) fail(`Drive folder "${name}" is ambiguous under the configured folder.`);
  if (result.files?.length === 1) return result.files[0].id;

  const folder = await driveRequest(token, "/files?fields=id,name&supportsAllDrives=true", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  return folder.id;
}

async function uploadAsset(token, parentId, name, mimeType, contents) {
  const query = new URLSearchParams({
    q: `name = '${name.replaceAll("'", "\\'")}' and '${parentId}' in parents and trashed = false`,
    fields: "files(id,name)",
    pageSize: "100",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
  });
  const result = await driveRequest(token, `/files?${query}`);
  if (result.nextPageToken) fail(`Drive folder contains too many matches for asset "${name}".`);
  if (result.files?.length > 1) fail(`Drive asset "${name}" is ambiguous in its destination folder.`);

  const existing = result.files?.[0];
  const metadata = existing ? { name } : { name, mimeType, parents: [parentId] };
  const boundary = `ageclarity_${process.pid}_${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    contents,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const method = existing ? "PATCH" : "POST";
  const target = existing ? `/files/${encodeURIComponent(existing.id)}` : "/files";
  const uploadQuery = new URLSearchParams({ uploadType: "multipart", fields: "id,name", supportsAllDrives: "true" });
  await driveRequest(token, `https://www.googleapis.com/upload/drive/v3${target}?${uploadQuery}`, {
    method,
    headers: { "content-type": `multipart/related; boundary=${boundary}` },
    body,
  });
}

if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
  fail("Drive sync is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 and GOOGLE_DRIVE_FOLDER_ID.");
}

try {
  execFileSync(process.execPath, [path.join(projectRoot, "scripts", "drive-verify.mjs")], {
    cwd: projectRoot,
    stdio: "inherit",
  });
} catch {
  fail("Drive sync stopped because a local manifest asset failed checksum verification.");
}

const token = await serviceAccountToken();
const folderResponse = await driveRequest(token, `/files/${encodeURIComponent(process.env.GOOGLE_DRIVE_FOLDER_ID)}?${new URLSearchParams({ fields: "id,name,mimeType,trashed", supportsAllDrives: "true" })}`);
if (folderResponse.mimeType !== "application/vnd.google-apps.folder" || folderResponse.trashed) {
  fail("GOOGLE_DRIVE_FOLDER_ID must identify an active Google Drive folder shared with the service account.");
}

for (const asset of manifest.files ?? []) {
  const relative = relativePath(asset.drive_path);
  if (path.basename(relative) !== asset.file) fail("Manifest filename does not match its Drive path.");
  const localPath = path.join(projectRoot, "drive", relative);
  const contents = await readFile(localPath);
  if (contents.byteLength > MAX_FILE_BYTES) fail(`Drive asset exceeds the 32 MiB limit: ${asset.file}`);
  const actualSha = createHash("sha256").update(contents).digest("hex");
  if (actualSha !== asset.sha256) fail(`Drive asset checksum does not match the manifest: ${asset.file}`);

  const folders = relative.split("/").slice(0, -1);
  let parentId = folderResponse.id;
  for (const name of folders) parentId = await ensureFolder(token, parentId, name);
  const extension = path.extname(asset.file).toLowerCase();
  const mimeType = extension === ".xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    : extension === ".json" ? "application/json"
      : extension === ".md" ? "text/markdown"
        : extension === ".py" ? "text/x-python" : "application/octet-stream";
  await uploadAsset(token, parentId, asset.file, mimeType, contents);
  console.log(`Synced ${asset.file}`);
}

console.log(`Synced ${manifest.files.length} assets to the configured Drive folder.`);
