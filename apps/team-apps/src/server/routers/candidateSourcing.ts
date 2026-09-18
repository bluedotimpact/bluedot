import { z } from 'zod';
import type {
  AshbyJob, AshbyLead, AssessmentJob, Catalog, Dataset, FeedbackJob, ImportPreview, ResultPage, Review, Role,
} from '../../features/candidate-sourcing/types';
import { router, staffProcedure } from '../trpc';

const search = z.object({ searchId: z.string().regex(/^[a-zA-Z0-9_-]*$/).max(100).default('') });
const id = z.string().min(1).max(200);
const role = z.object({
  title: z.string().min(1), organization: z.string(), brief: z.string(), rubric: z.string(),
  dimensions: z.array(z.object({ key: id, label: id, weight: z.number() })), sampling_terms: z.array(z.string()),
});
const source = z.union([
  z.object({ source_search_id: z.string().max(100) }).strict(),
  z.object({ csv: z.string().max(29 * 1024 * 1024), filename: z.string().max(255), mapping: z.record(z.string()) }).strict(),
]);

export const candidateSourcingRouter = router({
  catalog: staffProcedure.input(search).query(({ ctx, input }) => ctx.candidateEngine<Catalog>({ ...input, route: 'searches' })),
  data: staffProcedure.input(search).query(({ ctx, input }) => ctx.candidateEngine<Dataset>({ ...input, route: 'data' })),
  ashbyJobs: staffProcedure.input(search).query(({ ctx, input }) => ctx.candidateEngine<AshbyJob[]>({ ...input, route: 'ashby/jobs' })),
  ashbyJob: staffProcedure.input(search.extend({ id })).query(({ ctx, input }) => ctx.candidateEngine<AshbyJob>({ searchId: input.searchId, route: `ashby/job?id=${encodeURIComponent(input.id)}` })),
  assessment: staffProcedure.input(search).query(({ ctx, input }) => ctx.candidateEngine<AssessmentJob | null>({ ...input, route: 'assessments' })),
  feedback: staffProcedure.input(search).query(({ ctx, input }) => ctx.candidateEngine<FeedbackJob | null>({ ...input, route: 'feedback' })),
  results: staffProcedure.input(search.extend({ id, after: z.number().int().nonnegative() })).query(({ ctx, input }) => ctx.candidateEngine<ResultPage>({ searchId: input.searchId, route: `assessments/results?job_id=${encodeURIComponent(input.id)}&after=${input.after}` })),
  review: staffProcedure.input(search.extend({ person_key: id, version: z.number().int().nonnegative(), patch: z.object({ star: z.boolean().optional(), triage: z.enum(['', 'yes', 'maybe', 'no']).optional(), notes: z.string().max(20000).optional() }).strict() })).mutation(({ ctx, input: { searchId, ...body } }) => ctx.candidateEngine<Review>({ searchId, route: 'review', body })),
  addLead: staffProcedure.input(search.extend({
    person_key: id, revision: id, review_version: z.number().int().nonnegative(), assessment_job_id: id.optional(),
  })).mutation(({ ctx, input: { searchId, ...body } }) => ctx.candidateEngine<AshbyLead>({ searchId, route: 'ashby/lead', body })),
  assess: staffProcedure.input(search.extend({
    operation: z.discriminatedUnion('action', [
      z.object({ action: z.literal('start'), body: z.object({ count: z.number().int().positive(), revision: id }).strict() }),
      z.object({ action: z.literal('full'), body: z.object({ revision: id }).strict() }),
      z.object({ action: z.literal('retry'), body: z.object({ job_id: id }).strict() }),
      z.object({ action: z.literal('cancel'), body: z.object({ job_id: id }).strict() }),
    ]),
  })).mutation(({ ctx, input }) => ctx.candidateEngine<AssessmentJob>({ searchId: input.searchId, route: `assessments/${input.operation.action}`, body: input.operation.body })),
  reviewFeedback: staffProcedure.input(search.extend({
    operation: z.discriminatedUnion('action', [
      z.object({ action: z.literal('review'), body: z.object({ context: z.string().max(20000).optional() }).strict() }),
      z.object({ action: z.literal('approve'), body: z.object({ job_id: id }).strict() }),
      z.object({ action: z.literal('dismiss'), body: z.object({ job_id: id }).strict() }),
    ]),
  })).mutation(({ ctx, input }) => ctx.candidateEngine<FeedbackJob>({ searchId: input.searchId, route: `feedback/${input.operation.action}`, body: input.operation.body })),
  inspect: staffProcedure.input(search.extend({ csv: z.string().max(29 * 1024 * 1024) })).mutation(({ ctx, input: { searchId, ...body } }) => ctx.candidateEngine<ImportPreview>({ searchId, route: 'searches/inspect', body })),
  draft: staffProcedure.input(search.extend({ role: role.pick({ title: true, organization: true, brief: true }) })).mutation(({ ctx, input }) => ctx.candidateEngine<Role>({ searchId: input.searchId, route: 'roles/draft', body: input.role })),
  create: staffProcedure.input(search.extend({ role, ashby_job_id: id, source })).mutation(({ ctx, input }) => ctx.candidateEngine<{ url: string }>({ searchId: input.searchId, route: 'searches/create', body: { role: input.role, ashby_job_id: input.ashby_job_id, ...input.source } })),
});
