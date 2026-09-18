import { router } from '../trpc';
import { candidateSourcingRouter } from './candidateSourcing';

export const appRouter = router({ candidateSourcing: candidateSourcingRouter });
export type AppRouter = typeof appRouter;
