import { grantGranteeTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';
import { mapPublicGrantGrantees, type PublicGrantGrantee } from './grants.utils';

export const grantsRouter = router({
  getAllPublicGrantees: publicProcedure.query(async (): Promise<PublicGrantGrantee[]> => {
    try {
      const all = await db.scan(grantGranteeTable);

      return mapPublicGrantGrantees(all);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // eslint-disable-next-line no-console -- We want server logs if grants sync/schema is missing during rollout.
      console.error('[grants.getAllPublicGrantees] Failed to load grant grantees', error);

      if (/grant_grantee|does not exist|relation .* does not exist|column .* does not exist/i.test(errorMessage)) {
        // During rollout this table may not exist/sync yet; fail closed with empty data.
        return [];
      }

      throw error;
    }
  }),
});
