import { programTable } from '@bluedot/db';
import { z } from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

const getSortOrder = (value: string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};

// The Airtable `program` table holds everything someone can apply to on the
// website: grant types (category 'Funding') and in-person programs (all other
// categories).
export const getAllActivePrograms = async () => {
  const programs = await db.scan(programTable, { status: 'Active' });

  return programs.sort((a, b) => getSortOrder(a.order) - getSortOrder(b.order));
};

export const getAllActiveInPersonPrograms = async () => {
  const programs = await getAllActivePrograms();

  return programs.filter((program) => program.category !== 'Funding');
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
  return program ?? null;
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
