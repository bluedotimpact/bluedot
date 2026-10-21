import { teamMemberTable } from '@bluedot/db';
import { publicProcedure, router } from '../trpc';
import db from '../../lib/api/db';

function getFirstImageUrl(imageAttachmentUrls: string | string[] | null): string {
  if (!imageAttachmentUrls) {
    return '';
  }

  if (Array.isArray(imageAttachmentUrls)) {
    return imageAttachmentUrls[0] ?? '';
  }

  return imageAttachmentUrls.split(' ')[0] ?? '';
}

function getOptionalText(value: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
}

export const teamMembersRouter = router({
  // Staff count shown in public copy ("We're a team of N"). Counts every Active row in the Team table.
  getActiveCount: publicProcedure
    .query(async () => {
      const active = await db.scan(teamMemberTable, {
        status: 'Active',
      });

      return active.length;
    }),
  getAll: publicProcedure
    .query(async () => {
      const all = await db.scan(teamMemberTable, {
        status: 'Active',
      });

      return all
        .filter((m) => m.name && getFirstImageUrl(m.imagePublicUrls))
        .map((m) => ({
          name: m.name,
          jobTitle: m.jobTitle,
          subteam: getOptionalText(m.subteam),
          imageUrl: getFirstImageUrl(m.imagePublicUrls),
          url: m.url ?? undefined,
        }))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }),
  getOneOnOneAdvisors: publicProcedure
    .query(async () => {
      const all = await db.scan(teamMemberTable, {
        status: 'Active',
        isOneOnOneAdvisor: true,
      });

      return all
        .filter((m) => m.name && getFirstImageUrl(m.imagePublicUrls))
        .map((m) => ({
          name: m.name,
          jobTitle: m.jobTitle,
          imageUrl: getFirstImageUrl(m.imagePublicUrls),
          url: m.url ?? undefined,
          advisorProfileDescription: getOptionalText(m.advisorProfileDescription),
        }))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }),
});
