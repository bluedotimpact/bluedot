import { grantTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';
import { mapPublicGrants, type PublicGrant } from './grants.utils';

export const grantsRouter = router({
  getAllPublicGrantees: publicProcedure.query(async (): Promise<PublicGrant[]> => {
    const all = await db.scan(grantTable);
    return mapPublicGrants(all);
  }),
});
