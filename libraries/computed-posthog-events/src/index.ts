export {
  shipEventType as runProjection, createPosthogClient, deterministicUuid,
} from './core';
export type {
  EventProjectionRule as Projection, Event as Candidate, PosthogEvent, PosthogClient, PosthogClientConfig, ProjectionResult,
} from './core';
export { projections } from './definitions';
