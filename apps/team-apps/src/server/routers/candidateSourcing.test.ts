import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { candidateSourcingRouter } from './candidateSourcing';
import { type Context } from '../trpc';
const engine = vi.fn();
const caller = (auth: Context['auth'] = { sub: 'staff', email: 'staff@bluedot.org' }) => candidateSourcingRouter.createCaller({ auth, candidateEngine: engine });
beforeEach(() => engine.mockReset());

describe('candidate staff API', () => {
  test('requires staff authentication before any read or write', async () => {
    await expect(caller(null).catalog({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller(null).addLead({ person_key: 'person-0', revision: 'r1', review_version: 1 })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(engine).not.toHaveBeenCalled();
  });
  test('validates search IDs and assessment actions before forwarding', async () => {
    await expect(caller().data({ searchId: '../other' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller().assess({ operation: { action: 'start', body: { count: -1, revision: 'r1' } } })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(engine).not.toHaveBeenCalled();
  });
  test('forwards the current revision and requested count unchanged', async () => {
    engine.mockResolvedValue({ id: 'run-1', status: 'applying' });
    await caller().assess({ searchId: 'role-two', operation: { action: 'start', body: { count: 2, revision: 'r1' } } });
    expect(engine).toHaveBeenCalledWith({ searchId: 'role-two', route: 'assessments/start', body: { count: 2, revision: 'r1' } });
  });
  test('retains explicit feedback approval and cancellation', async () => {
    engine.mockResolvedValue({ id: 'job', status: 'applying' });
    await caller().reviewFeedback({ operation: { action: 'approve', body: { job_id: 'feedback-1' } } });
    expect(engine).toHaveBeenLastCalledWith({ searchId: '', route: 'feedback/approve', body: { job_id: 'feedback-1' } });
    await caller().assess({ operation: { action: 'cancel', body: { job_id: 'run-1' } } });
    expect(engine).toHaveBeenLastCalledWith({ searchId: '', route: 'assessments/cancel', body: { job_id: 'run-1' } });
  });
  test('sends the saved review version with a lead export', async () => {
    await caller().addLead({
      person_key: 'person-0', revision: 'r1', review_version: 3, assessment_job_id: 'run-1',
    });
    expect(engine).toHaveBeenCalledWith({
      searchId: '', route: 'ashby/lead', body: {
        person_key: 'person-0', revision: 'r1', review_version: 3, assessment_job_id: 'run-1',
      },
    });
  });
});
