import { bindRollups, rollupDefinitions } from '@bluedot/rollups';
import db from './db';

// The website only invalidates single rows; the full recompute runs in pg-sync-service.
export default bindRollups(db, rollupDefinitions);
