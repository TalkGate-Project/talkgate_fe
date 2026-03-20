/**
 * Priority 1–3: platform icons, chat filter icons, notification icon, project assets.
 * Usage: node scripts/convert-png-to-webp-tier1-3.mjs [--delete-png]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** @type {string[]} */
const ALLOWLIST_REL = [
  // Tier 1 — public/icons/platform
  "public/icons/platform/telegram.png",
  "public/icons/platform/instagram.png",
  "public/icons/platform/line.png",
  "public/icons/platform/kakao.png",
  "public/icons/platform/facebook.png",
  "public/icons/platform/x.png",
  // Tier 1 — ChatFilterModal (public root)
  "public/telegram.png",
  "public/instagram.png",
  "public/naver_line.png",
  "public/x_twitter.png",
  "public/x_twitter_dark.png",
  // Tier 2
  "public/notification-icon.png",
  // Tier 3 — projects (bundled assets)
  "src/assets/images/projects/please_drag.png",
  "src/assets/images/projects/please_drag_dark.png",
  "src/assets/images/projects/project-assigned-customer.png",
  "src/assets/images/projects/project-not-assigned-customer.png",
  "src/assets/images/projects/project-not-reserved-item.png",
  "src/assets/images/projects/project-reserved-item.png",
  "src/assets/images/projects/subscribe_proj_upper.png",
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
