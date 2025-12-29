/* eslint-disable no-console, no-continue */
/**
 * Lint rule for images in public/images.
 * - Size limit: 200KB
 * - Exceptions:
 *   - Filenames prefixed "oversize-" (add this if you really need an image to be over the limit)
 *   - Files under link-preview/* paths. These can be larger as they should never be loaded in a page
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

type OversizedImage = {
  relativePath: string;
  size: number;
};

function main() {
  const images = getAllImages(IMAGES_DIR);
  const oversized: OversizedImage[] = [];

  for (const imgPath of images) {
    const filename = path.basename(imgPath);
    const relativePath = path.relative(path.resolve(__dirname, '../public'), imgPath);

    if (filename.startsWith(OVERSIZE_PREFIX)) continue;
    if (relativePath.includes('link-preview')) continue;

    const stats = fs.statSync(imgPath);
    if (stats.size > SIZE_LIMIT) {
      oversized.push({ relativePath, size: stats.size });
    }
  }

  if (oversized.length > 0) {
    console.log(`Found ${oversized.length} images over ${formatBytes(SIZE_LIMIT)}:\n`);
    for (const img of oversized) {
      const ext = path.extname(img.relativePath);
      const webpPath = img.relativePath.replace(ext, '.webp');
      const isAlreadyWebp = ext.toLowerCase() === '.webp';

      console.log(`  /${img.relativePath} (${formatBytes(img.size)})`);
      if (isAlreadyWebp) {
        console.log(`    Already WebP. Resize it: magick public/${img.relativePath} -resize WIDTHx -quality 85 public/${img.relativePath}`);
      } else {
        console.log(`    Run command: magick public/${img.relativePath} -quality 85 public/${webpPath}`);
      }
    }

    console.log();
    console.log('If not already installed, install ImageMagick with `brew install imagemagick`');
    console.log(`If still over ${formatBytes(SIZE_LIMIT)} after conversion, resize: add '-resize WIDTHx' (set to 2x rendered width)`);
    console.log('If intentionally large, prefix filename with \'oversize-\'');
    console.log('Cleanup after conversion:');
    console.log('  - Update any references in code to use the new filename');
    console.log('  - Delete the old version');
    console.log();
    process.exit(1);
  }

  console.log(`All ${images.length} images are under ${formatBytes(SIZE_LIMIT)}.`);
}

main();
