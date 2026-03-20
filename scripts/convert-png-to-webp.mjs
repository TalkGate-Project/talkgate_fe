/**
 * Auth + dashboard shell PNG → WebP (allowlist only).
 * Usage: node scripts/convert-png-to-webp.mjs [--delete-png]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const ALLOWLIST_REL = [
  "src/assets/images/auth/login_bg.png",
  "src/assets/images/auth/login_card_contents.png",
  "src/assets/images/auth/login_card_strap.png",
  "src/assets/images/common/checked.png",
  "src/assets/images/common/unchecked.png",
  "public/kakao.png",
  "public/naver.png",
  "public/google.png",
  "public/main_logo.png",
  "public/main_logo_dark.png",
];

const QUALITY = 85;
const deleteSources = process.argv.includes("--delete-png");

async function main() {
  for (const rel of ALLOWLIST_REL) {
    const input = path.join(ROOT, rel);
    const output = input.replace(/\.png$/i, ".webp");

    try {
      await fs.access(input);
    } catch {
      console.warn(`skip (missing): ${rel}`);
      continue;
    }

    await sharp(input).webp({ quality: QUALITY, effort: 6 }).toFile(output);
    console.log(`ok: ${rel} → ${path.relative(ROOT, output)}`);

    if (deleteSources) {
      await fs.unlink(input);
      console.log(`  deleted: ${rel}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
