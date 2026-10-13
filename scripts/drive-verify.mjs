import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(projectRoot, "spec", "drive_manifest.json");

function manifestRelativePath(drivePath) {
  const prefix = "/Apps/ageclarity/";
  if (typeof drivePath !== "string" || !drivePath.startsWith(prefix)) {
    throw new Error("Manifest contains a path outside /Apps/ageclarity/.");
  }

  const relativePath = drivePath.slice(prefix.length);
  if (!relativePath || relativePath.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Manifest contains an invalid relative path.");
  }

  return relativePath;
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
let failures = 0;

for (const entry of manifest.files ?? []) {
  const relativePath = manifestRelativePath(entry.drive_path);
  if (path.basename(relativePath) !== entry.file) {
    console.error(`FAIL ${entry.file}: manifest filename does not match drive_path`);
    failures += 1;
    continue;
  }

  try {
    const contents = await readFile(path.join(projectRoot, "drive", relativePath));
    const actual = createHash("sha256").update(contents).digest("hex");
    if (actual !== entry.sha256) {
      console.error(`FAIL ${entry.file}: SHA-256 differs from the manifest`);
      failures += 1;
    } else {
      console.log(`OK   ${entry.file}`);
    }
  } catch {
    console.error(`FAIL ${entry.file}: file is missing or unreadable`);
    failures += 1;
  }
}

if (!manifest.files?.length) {
  console.error("FAIL manifest has no files");
  failures += 1;
}

if (failures) {
  console.error(`Drive manifest verification failed (${failures} issue${failures === 1 ? "" : "s"}).`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${manifest.files.length} Drive asset checksums.`);
}
