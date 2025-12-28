/* eslint-disable no-console, no-continue */
/**
 * Lint rule for images in public/images.
 * - Size limit: 200KB
 * - Escape hatch: prefix filename with "oversize-"
 */
import fs from 'fs';
import path from 'path';

const IMAGES_DIR = path.resolve(__dirname, '../public/images');
const SIZE_LIMIT = 200 * 1024; // 200KB
const OVERSIZE_PREFIX = 'oversize-';

function getAllImages(dir: string): string[] {
  const images: string[] = [];
  if (!fs.existsSync(dir)) return images;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      images.push(...getAllImages(fullPath));
    } else if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(entry.name)) {
      images.push(fullPath);
    }
  }
  return images;
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)}KB`
    : `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function main() {
  const images = getAllImages(IMAGES_DIR);
  const errors: string[] = [];

  for (const imgPath of images) {
    const filename = path.basename(imgPath);
    const relativePath = path.relative(path.resolve(__dirname, '../public'), imgPath);

    // Skip oversize-prefixed files
    if (filename.startsWith(OVERSIZE_PREFIX)) continue;

    // Check size
    const stats = fs.statSync(imgPath);
    if (stats.size > SIZE_LIMIT) {
      errors.push(`/${relativePath} is ${formatBytes(stats.size)} (limit ${formatBytes(SIZE_LIMIT)})`);
    }
  }

  if (errors.length > 0) {
    console.log(`Found ${errors.length} images over ${formatBytes(SIZE_LIMIT)}:\n`);
    for (const err of errors) {
      console.log(`  ${err}`);
    }
    console.log(`
Most images can get under 200KB by converting to .webp and resizing to at most
2x the rendered size (for retina displays). .webp typically achieves 50-80% smaller
files than PNG/JPEG at equivalent quality.

To fix:
  0. Install ImageMagick if needed:  brew install imagemagick
  1. Resize and convert:  magick input.png -resize WIDTHx -quality 85 output.webp
     Set WIDTH to 2x the max rendered size. For banners or repeating images,
     pick a sensible middle ground (e.g. 1200-1600px).
  2. If intentionally large, prefix filename with "oversize-"
`);
    process.exit(1);
  }

  console.log(`All ${images.length} images are under ${formatBytes(SIZE_LIMIT)}.`);
}

main();
