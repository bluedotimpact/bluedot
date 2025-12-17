/* eslint-disable no-console */
/**
 * Script to find unused images in public/images by checking:
 * 1. Database content fields (body, content, description, resourceGuide, etc.)
 * 2. Dynamic slug-based image loading patterns (certificates, OG images)
 * 3. Hardcoded references in the codebase (both relative /images/ and absolute bluedot.org/images/)
 * 4. Storybook files (separate category - may be test-only)
 *
 * Usage:
 *   cd apps/website
 *   npx tsx scripts/find-unused-images.ts
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables BEFORE any dynamic imports
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../');
const WEBSITE_ROOT = path.resolve(__dirname, '../');
const IMAGES_DIR = path.join(WEBSITE_ROOT, 'public/images');

// These will be loaded dynamically after env vars are set
let db: Awaited<ReturnType<typeof initDb>>;
let blogTable: Awaited<ReturnType<typeof loadTables>>['blogTable'];
let chunkTable: Awaited<ReturnType<typeof loadTables>>['chunkTable'];
let courseTable: Awaited<ReturnType<typeof loadTables>>['courseTable'];
let exerciseTable: Awaited<ReturnType<typeof loadTables>>['exerciseTable'];
let jobPostingTable: Awaited<ReturnType<typeof loadTables>>['jobPostingTable'];
let projectTable: Awaited<ReturnType<typeof loadTables>>['projectTable'];
let unitResourceTable: Awaited<ReturnType<typeof loadTables>>['unitResourceTable'];
let unitTable: Awaited<ReturnType<typeof loadTables>>['unitTable'];

async function initDb() {
  const { PgAirtableDb } = await import('@bluedot/db');
  return new PgAirtableDb({
    pgConnString: process.env.PG_URL!,
    airtableApiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN!,
  });
}

async function loadTables() {
  const dbModule = await import('@bluedot/db');
  return {
    blogTable: dbModule.blogTable,
    chunkTable: dbModule.chunkTable,
    courseTable: dbModule.courseTable,
    exerciseTable: dbModule.exerciseTable,
    jobPostingTable: dbModule.jobPostingTable,
    projectTable: dbModule.projectTable,
    unitResourceTable: dbModule.unitResourceTable,
    unitTable: dbModule.unitTable,
  };
}

function getAllImages(dir: string, basePath = ''): string[] {
  const images: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = path.join(basePath, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      images.push(...getAllImages(fullPath, relativePath));
    } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(entry.name)) {
      images.push(`/images/${relativePath}`);
    }
  }

  return images;
}

function extractImageReferences(content: string): string[] {
  const matches: string[] = [];
  const regex = /(?:https?:\/\/[^/]+)?\/images\/[a-zA-Z0-9_\-/.]+\.(png|jpg|jpeg|gif|webp|svg)/gi;
  let match = regex.exec(content);
  while (match !== null) {
    const normalized = match[0].replace(/^https?:\/\/[^/]+/, '');
    matches.push(normalized);
    match = regex.exec(content);
  }
  return matches;
}

function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getCodebaseReferences(): { production: Set<string>; storybook: Set<string> } {
  const production = new Set<string>();
  const storybook = new Set<string>();

  const rgPattern = '(?:https?://[^/]+)?/images/[a-zA-Z0-9_\\-/.]+\\.(png|jpg|jpeg|gif|webp|svg)';
  const grepPattern = '/images/[a-zA-Z0-9_/-]*\\.[a-z]*';

  const useRipgrep = commandExists('rg');
  const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build', '.turbo', '__snapshots__'];

  try {
    let result: string;

    if (useRipgrep) {
      const rgExcludes = excludeDirs.map((d) => `--glob '!${d}/'`).join(' ');
      result = execSync(
        `rg -o '${rgPattern}' --no-filename ${rgExcludes} ${WORKSPACE_ROOT}`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
      );
    } else {
      const excludeArgs = excludeDirs.map((d) => `--exclude-dir=${d}`).join(' ');
      result = execSync(
        `grep -r -o -E '${grepPattern}' ${excludeArgs} ${WORKSPACE_ROOT} 2>/dev/null || true`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
      );
    }

    for (const line of result.split('\n')) {
      const matchStr = line.includes(':') && !useRipgrep
        ? line.split(':').slice(1).join(':').trim()
        : line.trim();

      if (matchStr && matchStr.startsWith('/images/')) {
        const normalized = matchStr.replace(/^https?:\/\/[^/]+/, '');
        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(normalized)) {
          production.add(normalized);
        }
      }
    }

    console.log(`   (using ${useRipgrep ? 'ripgrep' : 'grep'} for codebase search)`);
  } catch (error) {
    console.warn('Warning: codebase search failed:', error);
  }

  try {
    let storybookResult: string;

    if (useRipgrep) {
      const rgExcludes = excludeDirs.map((d) => `--glob '!${d}/'`).join(' ');
      storybookResult = execSync(
        `rg -o '${rgPattern}' --glob '*.stories.*' ${rgExcludes} ${WORKSPACE_ROOT}`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
      );
    } else {
      storybookResult = execSync(
        `find ${WORKSPACE_ROOT} -name "*.stories.*" -type f ! -path "*/node_modules/*" -exec grep -o -E '${grepPattern}' {} \\; 2>/dev/null || true`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
      );
    }

    for (const line of storybookResult.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && trimmed.startsWith('/images/')) {
        const normalized = trimmed.replace(/^https?:\/\/[^/]+/, '');
        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(normalized)) {
          storybook.add(normalized);
        }
      }
    }
  } catch {
    // No storybook references found
  }

  return { production, storybook };
}

async function getDatabaseReferences(): Promise<Set<string>> {
  const references = new Set<string>();

  console.log('Scanning database tables for image references...');

  const tablesToScan = [
    { name: 'blog', table: blogTable, fields: ['body'] },
    { name: 'chunk', table: chunkTable, fields: ['chunkContent'] },
    { name: 'course', table: courseTable, fields: ['description', 'certificationBadgeImage', 'image'] },
    { name: 'exercise', table: exerciseTable, fields: ['description'] },
    { name: 'jobPosting', table: jobPostingTable, fields: ['body'] },
    { name: 'project', table: projectTable, fields: ['body', 'coverImageSrc'] },
    { name: 'unit', table: unitTable, fields: ['content'] },
    { name: 'unitResource', table: unitResourceTable, fields: ['description', 'resourceGuide'] },
  ];

  for (const { name, table, fields } of tablesToScan) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const records = await db.scan(table as Parameters<typeof db.scan>[0]);
      console.log(`  ${name}: ${records.length} records`);

      for (const record of records) {
        for (const field of fields) {
          const value = (record as Record<string, unknown>)[field];
          if (typeof value === 'string' && value.includes('/images/')) {
            const refs = extractImageReferences(value);
            for (const ref of refs) {
              references.add(ref);
            }
          }
        }
      }
    } catch (error) {
      console.error(`  Error scanning ${name}:`, error);
    }
  }

  return references;
}

async function getDynamicSlugReferences(): Promise<{ used: Set<string>; patterns: string[] }> {
  const used = new Set<string>();
  const patterns: string[] = [];

  console.log('Checking dynamic slug-based image patterns...');

  try {
    const courses = await db.scan(courseTable);
    console.log(`  Found ${courses.length} courses`);

    for (const course of courses) {
      if (course.slug) {
        used.add(`/images/certificates/${course.slug}.png`);
        used.add(`/images/courses/link-preview/${course.slug}.png`);
      }
    }
    patterns.push('Certificate badges: /images/certificates/{course.slug}.png');
    patterns.push('Course OG images: /images/courses/link-preview/{course.slug}.png');
  } catch (error) {
    console.error('  Error fetching courses:', error);
  }

  try {
    const jobs = await db.scan(jobPostingTable);
    console.log(`  Found ${jobs.length} job postings`);

    for (const job of jobs) {
      if (job.slug) {
        used.add(`/images/jobs/link-preview/${job.slug}.png`);
      }
    }
    patterns.push('Job OG images: /images/jobs/link-preview/{job.slug}.png');
  } catch (error) {
    console.error('  Error fetching jobs:', error);
  }

  return { used, patterns };
}

function getFileSize(imagePath: string): string {
  const fullPath = path.join(WEBSITE_ROOT, 'public', imagePath);
  try {
    const stats = fs.statSync(fullPath);
    const kb = stats.size / 1024;
    if (kb > 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${kb.toFixed(0)} KB`;
  } catch {
    return 'unknown';
  }
}

async function main() {
  // Initialize database connection (must happen after dotenv.config)
  db = await initDb();
  const tables = await loadTables();
  blogTable = tables.blogTable;
  chunkTable = tables.chunkTable;
  courseTable = tables.courseTable;
  exerciseTable = tables.exerciseTable;
  jobPostingTable = tables.jobPostingTable;
  projectTable = tables.projectTable;
  unitResourceTable = tables.unitResourceTable;
  unitTable = tables.unitTable;

  console.log('=== Image Usage Analysis ===\n');

  console.log('1. Scanning public/images directory...');
  const allImages = getAllImages(IMAGES_DIR);
  console.log(`   Found ${allImages.length} images\n`);

  console.log('2. Scanning codebase for image references...');
  const { production: codebaseRefs, storybook: storybookRefs } = getCodebaseReferences();
  console.log(`   Found ${codebaseRefs.size} references in production code`);
  console.log(`   Found ${storybookRefs.size} references in storybook files\n`);

  console.log('3. Scanning database for image references...');
  const dbRefs = await getDatabaseReferences();
  console.log(`   Found ${dbRefs.size} references in database content\n`);

  console.log('4. Checking dynamic slug-based patterns...');
  const { used: slugRefs, patterns } = await getDynamicSlugReferences();
  console.log(`   Found ${slugRefs.size} potential dynamic references`);
  console.log('   Patterns checked:');
  for (const p of patterns) {
    console.log(`     - ${p}`);
  }
  console.log();

  const allRefs = new Set([...codebaseRefs, ...dbRefs, ...slugRefs]);

  const usedImages: string[] = [];
  const storybookOnlyImages: string[] = [];
  const unusedImages: string[] = [];
  const dynamicButMissing: string[] = [];

  for (const image of allImages) {
    if (allRefs.has(image)) {
      usedImages.push(image);
    } else if (storybookRefs.has(image)) {
      storybookOnlyImages.push(image);
    } else {
      unusedImages.push(image);
    }
  }

  for (const ref of slugRefs) {
    if (!allImages.includes(ref)) {
      dynamicButMissing.push(ref);
    }
  }

  console.log('=== RESULTS ===\n');

  console.log(`USED IN PRODUCTION (${usedImages.length} images):`);
  for (const img of usedImages.sort()) {
    console.log(`   ${img}`);
  }

  console.log(`\nSTORYBOOK ONLY (${storybookOnlyImages.length} images):`);
  console.log('   (These are only referenced in .stories.* files)');
  for (const img of storybookOnlyImages.sort()) {
    console.log(`   ${img} (${getFileSize(img)})`);
  }

  console.log(`\nSAFE TO DELETE (${unusedImages.length} images):`);
  let totalSize = 0;
  for (const img of unusedImages.sort()) {
    const size = getFileSize(img);
    console.log(`   ${img} (${size})`);
    const sizeMatch = size.match(/([\d.]+)\s*(KB|MB)/);
    if (sizeMatch && sizeMatch[1]) {
      const value = parseFloat(sizeMatch[1]);
      totalSize += sizeMatch[2] === 'MB' ? value * 1024 : value;
    }
  }
  console.log(`\n   Total size of unused images: ${(totalSize / 1024).toFixed(1)} MB`);

  console.log('\nDATABASE REFERENCES TO NON-EXISTENT IMAGES:');
  const imageSet = new Set(allImages);
  let brokenRefs = 0;
  for (const ref of dbRefs) {
    if (!imageSet.has(ref)) {
      console.log(`   ${ref}`);
      brokenRefs += 1;
    }
  }
  if (brokenRefs === 0) {
    console.log('   (none)');
  }

  if (dynamicButMissing.length > 0) {
    console.log('\nDYNAMIC PATTERN IMAGES THAT COULD EXIST (but don\'t):');
    console.log('   (These would be used if the file existed - fallback is used instead)');
    for (const ref of dynamicButMissing.sort()) {
      console.log(`   ${ref}`);
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
