import { createDbClient } from '@bluedot/db';
import env from '../env';

export const db = createDbClient(env.PG_URL);
