import { createRollups, rollupDefinitions } from '@bluedot/rollups';
import db from './db';

// No writeBatch: the website only invalidates single rows. The full recompute runs in pg-sync-service.
export default createRollups(db, rollupDefinitions);
