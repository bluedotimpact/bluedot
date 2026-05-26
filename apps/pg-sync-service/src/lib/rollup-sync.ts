import { bindRollups, rollupDefinitions } from '@bluedot/rollups';
import { db } from './db';

const rollups = bindRollups(db, rollupDefinitions);

export const recomputeRollups = () => rollups.invalidate();
