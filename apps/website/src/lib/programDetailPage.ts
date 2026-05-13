import type { GetStaticPropsResult } from 'next';
import { ONE_MINUTE_SECONDS } from './constants';
import { getProgramBySlug } from '../server/routers/programs';

export type ProgramDetailPageProps = {
  programName: string;
  programDescription: string;
};

/**
 * Fetches the program with the given slug at build time so that
 * `<title>` and `<meta name="description">` (used by link previews and SEO)
 * stay in sync with the Programs Airtable table without a redeploy. ISR
 * revalidates every 5 minutes.
 *
 * Looks up by slug regardless of status — a Draft row still renders its
 * own detail page; status only gates listing surfaces (/programs, Nav).
 *
 * Falls back to the supplied defaults when the program is missing from the
 * sync (e.g. while staging Postgres is still seeding) so the page still
 * renders coherent meta.
 */
export const getProgramDetailPageStaticProps = async (
  slug: string,
  fallback: ProgramDetailPageProps,
): Promise<GetStaticPropsResult<ProgramDetailPageProps>> => {
  try {
    const program = await getProgramBySlug(slug);

    return {
      props: {
        programName: program?.name ?? fallback.programName,
        programDescription: program?.description ?? fallback.programDescription,
      },
      revalidate: 5 * ONE_MINUTE_SECONDS,
    };
  } catch {
    return {
      props: fallback,
      revalidate: ONE_MINUTE_SECONDS,
    };
  }
};
