import { programTable } from '@bluedot/db';
import { z } from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

const getSortOrder = (value: string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};

export const getAllActivePrograms = async () => {
  const programs = await db.scan(programTable, { status: 'Active' });

  return programs.sort((a, b) => getSortOrder(a.order) - getSortOrder(b.order));
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

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return getProgramBySlug(input.slug);
    }),
});
