// news-image-20261124 — entry runner.
//
// The finished front page already lives next to this file as entry.png
// (drawn by build_image.py, a seeded PIL program). This runner only
// checks that the image is a valid 1024x1024 PNG under 1 MiB and copies
// it into the output directory the platform expects. It uses nothing
// but the Node standard library and makes no network calls.
// Written as plain JavaScript so it runs on any Node 22 as-is.

import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, "entry.png");
const TARGET_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const TARGET = join(TARGET_DIR, "entry.png");

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024;

function fail(message) {
  console.error(`entry check failed: ${message}`);
  process.exit(1);
}

const bytes = readFileSync(SOURCE);

if (bytes.length > MAX_BYTES) {
  fail(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}
if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
  fail("entry.png does not start with the PNG magic bytes");
}

// The IHDR chunk follows the 8-byte signature: 4 bytes length,
// 4 bytes chunk type ("IHDR"), then width and height as big-endian
// 32-bit integers at offsets 16 and 20.
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  fail(`entry.png is ${width}x${height}, expected 1024x1024`);
}

mkdirSync(TARGET_DIR, { recursive: true });
copyFileSync(SOURCE, TARGET);

const written = statSync(TARGET).size;
console.log(`wrote ${TARGET} (${written} bytes, ${width}x${height} PNG)`);
