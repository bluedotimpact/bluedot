import { createRollups, rollupDefinitions } from '@bluedot/rollups';
import { db } from './db';

const rollups = createRollups(db, rollupDefinitions);

export const recomputeRollups = () => rollups.invalidate();
