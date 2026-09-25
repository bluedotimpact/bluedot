import { programTable } from '@bluedot/db';
import { z } from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

const getSortOrder = (value: string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};

// TEMPORARY bridge while Airtable still stores the old grant type slugs. Once
// the `program` rows use 'rapid' and 'career-transition', delete this map and
// its uses in getAllActivePrograms and getProgramBySlug.
const LEGACY_SLUGS = new Map([
  ['rapid', 'rapid-grants'],
  ['career-transition', 'career-transition-grant'],
]);
const CURRENT_SLUGS = new Map([...LEGACY_SLUGS].map(([current, legacy]) => [legacy, current]));

const withCurrentSlug = <T extends { slug: string | null }>(program: T): T => {
  const currentSlug = program.slug ? CURRENT_SLUGS.get(program.slug) : undefined;
  return currentSlug ? { ...program, slug: currentSlug } : program;
};

export const getAllActivePrograms = async () => {
  const programs = await db.scan(programTable, { status: 'Active' });

  return programs
    .map(withCurrentSlug)
    .sort((a, b) => getSortOrder(a.order) - getSortOrder(b.order));
};

const NON_PROGRAM_SLUGS = new Set([
  'advising',
  'technical-ai-safety-project-sprint',
]);

export const getAllActiveInPersonPrograms = async () => {
  const programs = await getAllActivePrograms();

  return programs.filter((program) => (
    program.category !== 'Funding'
    && !NON_PROGRAM_SLUGS.has(program.slug ?? '')
  ));
};

export const getAllActiveGrants = async () => {
  const programs = await getAllActivePrograms();

  return programs.filter((program) => program.category === 'Funding');
};

/**
 * Lookup a single program by slug, ignoring status. Used by program
 * detail pages so a Draft row can still render its own page (meta tags,
 * Apply CTA) while staying out of /programs index and Nav.
 */
export const getProgramBySlug = async (slug: string) => {
  const [program] = await db.scan(programTable, { slug });
  if (program) return withCurrentSlug(program);

  const legacySlug = LEGACY_SLUGS.get(slug);
  if (!legacySlug) return null;

  const [legacyProgram] = await db.scan(programTable, { slug: legacySlug });
  return legacyProgram ? withCurrentSlug(legacyProgram) : null;
};

export const programsRouter = router({
  getAll: publicProcedure.query(async () => {
    return getAllActivePrograms();
  }),

  getInPerson: publicProcedure.query(async () => {
    return getAllActiveInPersonPrograms();
  }),

  getGrants: publicProcedure.query(async () => {
    return getAllActiveGrants();
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return getProgramBySlug(input.slug);
    }),
});
