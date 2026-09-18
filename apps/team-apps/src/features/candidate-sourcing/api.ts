import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import type { AppRouter } from '../../server/routers/_app';
import { authFetch } from '../../lib/client/api';
import type { TalentApi } from './types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const candidatePath = (url: string): string => {
  if (url === '/') return '/candidate-sourcing';
  const match = /^\/search\/([a-zA-Z0-9_-]+)\/$/.exec(url);
  if (!match) throw new Error('This search address is invalid. Choose the role again.');
  return `/candidate-sourcing/${match[1]}`;
};

export const createCandidateApi = (searchId: string): TalentApi => {
  const client = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/api/trpc', fetch: authFetch })] }).candidateSourcing;
  const read = async <T>(request: Promise<T>): Promise<T> => {
    try {
      return await request;
    } catch (error) {
      if (error instanceof TRPCClientError) throw new ApiError(error.message, error.data?.httpStatus ?? 500);
      throw error;
    }
  };

  return {
    catalog: () => read(client.catalog.query({ searchId })),
    data: () => read(client.data.query({ searchId })),
    ashbyJobs: () => read(client.ashbyJobs.query({ searchId })),
    ashbyJob: (id) => read(client.ashbyJob.query({ searchId, id })),
    assessment: () => read(client.assessment.query({ searchId })),
    feedback: () => read(client.feedback.query({ searchId })),
    results: (id, after) => read(client.results.query({ searchId, id, after })),
    review: (person_key, version, patch) => read(client.review.mutate({
      searchId, person_key, version, patch,
    })),
    addLead: (person_key, revision, review_version, assessment_job_id) => read(client.addLead.mutate({
      searchId, person_key, revision, review_version, assessment_job_id,
    })),
    assess: (action, body) => {
      if (action === 'start') return read(client.assess.mutate({ searchId, operation: { action, body: { count: body.count!, revision: body.revision! } } }));
      if (action === 'full') return read(client.assess.mutate({ searchId, operation: { action, body: { revision: body.revision! } } }));
      return read(client.assess.mutate({ searchId, operation: { action, body: { job_id: body.job_id! } } }));
    },
    reviewFeedback: (action, body) => read(client.reviewFeedback.mutate({ searchId, operation: action === 'review' ? { action, body: { context: body.context } } : { action, body: { job_id: body.job_id! } } })),
    inspect: (csv) => read(client.inspect.mutate({ searchId, csv })),
    draft: (role) => read(client.draft.mutate({ searchId, role })),
    create: ({ role, ashby_job_id, ...source }) => read(client.create.mutate({
      searchId, role, ashby_job_id, source,
    })),
  };
};
