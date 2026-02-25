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

export const teamMembersRouter = router({
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
          imageUrl: getFirstImageUrl(m.imagePublicUrls),
          url: m.url ?? undefined,
        }))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }),
});
