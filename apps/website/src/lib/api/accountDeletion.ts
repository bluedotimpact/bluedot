import {
  and,
  arrayContained,
  arrayContains,
  arrayOverlaps,
  courseRegistrationTable,
  deletionRequestTable,
  eq,
  exerciseResponsePgTable,
  inArray,
  meetPersonTable,
  projectSubmissionTable,
  resourceCompletionPgTable,
  selfServeCourseRegistrationTable,
  userTable,
  type PgAirtableColumnInput,
  type PgAirtableTable,
  type SQL,
  type SQLWrapper,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { deleteKeycloakUser, keycloakUserExists } from './keycloak';
import { CIO_API_BASE, getProfileById, setSubscriptionTopics } from './customerio';
import db from './db';
import env from './env';
import { DELETION_REQUEST_STATUS } from '../constants';

// A newsletter signup is independent of the account, so deletion leaves it subscribed.
const NEWSLETTER_TOPIC = 'topic_15';

// Error if we try to delete more rows than a single account plausibly owns, to limit
// the blast radius of a "match all rows" bug
const MAX_DELETIONS_PER_STEP = 1000;

type DeletionStep = {
  name: string;
  /** Deletes everything the step owns and returns how many records were deleted. */
  run: () => Promise<number>;
};

export const runAccountDeletion = async (deletionRequestId: string) => {
  const [request] = await db.scan(deletionRequestTable, { id: deletionRequestId });
  if (!request) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Deletion request not found' });
  }

  if (request.status === DELETION_REQUEST_STATUS.completed) {
    return { status: DELETION_REQUEST_STATUS.completed, steps: [] as { step: string; deleted: number }[] };
  }

  if (request.status !== DELETION_REQUEST_STATUS.pending && request.status !== DELETION_REQUEST_STATUS.failed) {
    throw new TRPCError({ code: 'CONFLICT', message: `Deletion request is "${request.status}"` });
  }

  if (!request.userId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Deletion request is missing the user id' });
  }

  const { userId } = request;
  // Airtable gives back '' rather than null for an empty cell
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const keycloakIdentifier = request.keycloakIdentifier || null;

  // Both anchors are read before anything is deleted, so a retry can still find the dependents.
  const registrationIds = (await db.pg
    .select({ id: courseRegistrationTable.pg.id })
    .from(courseRegistrationTable.pg)
    .where(eq(courseRegistrationTable.pg.userId, userId))).map((row) => row.id);

  const meetPersonIds = registrationIds.length === 0 ? [] : (await db.pg
    .select({ id: meetPersonTable.pg.id })
    .from(meetPersonTable.pg)
    .where(inArray(meetPersonTable.pg.applicationsBaseRecordId, registrationIds))).map((row) => row.id);

  await db.update(deletionRequestTable, { id: request.id, status: DELETION_REQUEST_STATUS.inProgress });

  const steps: { step: string; deleted: number }[] = [];
  const summarise = () => steps.map(({ step, deleted }) => `${step} (${deleted})`).join(', ') || 'none';

  for (const step of buildDeletionSteps({
    userId, keycloakIdentifier, registrationIds, meetPersonIds,
  })) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const deleted = await step.run();
      steps.push({ step: step.name, deleted });
    } catch (error) {
      // eslint-disable-next-line no-await-in-loop
      await failDeletionRequest(request.id, `Failed at step "${step.name}": ${error instanceof Error ? error.message : String(error)}. Completed: ${summarise()}`, error);
    }
  }

  // Completion promises the email is freed, so check the Airtable user row and the Keycloak login.
  const survivingUserObjects = await Promise.all([
    // Use airtableClient directly to check the source of truth
    db.airtableClient.scan(userTable.airtable, { filterByFormula: `RECORD_ID()='${userId}'` }),
    keycloakIdentifier === null ? false : keycloakUserExists(keycloakIdentifier),
  ]).then(([userRecords, keycloakUserSurvives]) => [
    ...userRecords.map((record) => `user record ${record.id}`),
    ...(keycloakUserSurvives ? [`Keycloak user ${keycloakIdentifier}`] : []),
  ]).catch((error: unknown) => failDeletionRequest(request.id, `Failed checking the account is gone: ${error instanceof Error ? error.message : String(error)}. Completed: ${summarise()}`, error));

  if (survivingUserObjects.length > 0) {
    await failDeletionRequest(request.id, `Failed to free email: ${survivingUserObjects.join(', ')} survived deletion.`);
  }

  await db.update(deletionRequestTable, {
    id: request.id,
    status: DELETION_REQUEST_STATUS.completed,
    completedAt: new Date().toISOString(),
  });

  logger.info(`[AccountDeletion] deletion request ${request.id} completed: ${summarise()}`);

  return { status: DELETION_REQUEST_STATUS.completed, steps };
};

// Bottom-up ordering: everything that hangs off the course records, then the records themselves, then the user row, then Keycloak.
const buildDeletionSteps = ({ userId, keycloakIdentifier, registrationIds, meetPersonIds }: { userId: string; keycloakIdentifier: string | null; registrationIds: string[]; meetPersonIds: string[] }): DeletionStep[] => {
  if (!userId) {
    throw new Error('userId is null or empty');
  }

  // Rows linked to these ids and nobody else. The overlap check is what keeps `<@` from also matching
  // every row linked to nobody, which is how an empty Airtable cell syncs.
  const linkedSolelyTo = (column: SQLWrapper, ids: string[]): SQL | 'skip' => (
    ids.length === 0 ? 'skip' : and(arrayOverlaps(column, ids), arrayContained(column, ids))!
  );

  return [
    {
    // Keep the customer.io profile, this email may have subscribed to newsletters while logged out
      name: 'customerio-subscription-topics',
      run: async () => {
        const profile = await getProfileById(userId);
        const cioId = profile?.identifiers?.cio_id;
        if (cioId === undefined) return 0;

        const res = await fetch(`${CIO_API_BASE}/customers/${encodeURIComponent(cioId)}/subscription_preferences`, {
          headers: { Authorization: `Bearer ${env.CIO_APP_API_KEY}` },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch customer.io subscription preferences: HTTP ${res.status}`);
        }

        // Every topic is subscribed-by-default: unsubscribe whatever the person never explicitly chose.
        const data = await res.json() as { customer?: { topics?: { id: number; subscribed: boolean }[] } };
        const rawChosen = profile?.attributes?.cio_subscription_preferences;
        const chosen = typeof rawChosen === 'string' ? (JSON.parse(rawChosen) as { topics?: Record<string, boolean> }).topics ?? {} : {};
        const keepNewsletter = profile?.attributes?.anonymous_id !== undefined;

        const topics = (data.customer?.topics ?? [])
          .filter((topic) => topic.subscribed)
          .map((topic) => `topic_${topic.id}`)
          .filter((topic) => chosen[topic] === undefined && !(keepNewsletter && topic === NEWSLETTER_TOPIC));
        if (topics.length === 0) return 0;

        await setSubscriptionTopics({ cioId, topics: Object.fromEntries(topics.map((topic) => [topic, false])) });
        return 1;
      },
    },
    deleteMatchingPgRecords({ name: 'exercise-responses', table: exerciseResponsePgTable, sqlCondition: arrayContains(exerciseResponsePgTable.pg.userId, [userId]) }),
    deleteMatchingPgRecords({ name: 'resource-completions', table: resourceCompletionPgTable, sqlCondition: arrayContains(resourceCompletionPgTable.pg.userId, [userId]) }),
    deleteMatchingAirtableRecords({ name: 'self-serve-course-registrations', table: selfServeCourseRegistrationTable, sqlCondition: eq(selfServeCourseRegistrationTable.pg.userId, userId) }),
    // Leave project submissions that have co-authors
    deleteMatchingAirtableRecords({ name: 'project-submissions', table: projectSubmissionTable, sqlCondition: linkedSolelyTo(projectSubmissionTable.pg.participant, meetPersonIds) }),
    deleteMatchingAirtableRecords({ name: 'course-registrations', table: courseRegistrationTable, sqlCondition: registrationIds.length === 0 ? 'skip' : inArray(courseRegistrationTable.pg.id, registrationIds) }),
    deleteMatchingAirtableRecords({ name: 'user-record', table: userTable, sqlCondition: eq(userTable.pg.id, userId) }),
    {
      name: 'keycloak-user',
      run: async () => {
        if (keycloakIdentifier === null || !(await keycloakUserExists(keycloakIdentifier))) return 0;

        await deleteKeycloakUser(keycloakIdentifier);
        return 1;
      },
    },
  ];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const findIdsToDelete = async (pgTable: any, sqlCondition: SQL | 'skip'): Promise<string[]> => {
  if (!sqlCondition) {
    throw new Error('sqlCondition is missing');
  }

  if (sqlCondition === 'skip') return [];

  // Drizzle cannot infer a select over a still-generic table, hence the cast (same as db.scan).
  const rows = await (db.pg.select({ id: pgTable.id }).from(pgTable).where(sqlCondition) as Promise<{ id: string }[]>);
  if (rows.length > MAX_DELETIONS_PER_STEP) {
    throw new Error(`Matched ${rows.length} records, more than the maximum of ${MAX_DELETIONS_PER_STEP}`);
  }

  return rows.map((row) => row.id);
};

const deleteMatchingAirtableRecords = <TName extends string, TColumns extends Record<string, PgAirtableColumnInput>>(
  { name, table, sqlCondition }: { name: string; table: PgAirtableTable<TName, TColumns>; sqlCondition: SQL | 'skip' },
): DeletionStep => ({
  name,
  run: async () => {
    const ids = await findIdsToDelete(table.pg, sqlCondition);
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await db.remove(table, id);
    }

    return ids.length;
  },
});

const deleteMatchingPgRecords = ({ name, table, sqlCondition }: { name: string; table: typeof exerciseResponsePgTable | typeof resourceCompletionPgTable; sqlCondition: SQL | 'skip' }): DeletionStep => ({
  name,
  run: async () => {
    const ids = await findIdsToDelete(table.pg, sqlCondition);
    if (ids.length === 0) return 0;

    await db.pg.delete(table.pg).where(inArray(table.pg.id, ids));
    return ids.length;
  },
});

const failDeletionRequest = async (id: string, detail: string, cause?: unknown): Promise<never> => {
  // If this write also fails the row is stuck "In progress"; the alert says how to unstick it.
  let markFailedError: Error | null = null;
  let completedByAnotherRun = false;
  try {
    // Never downgrade Completed: a concurrent run may have finished the deletion while this one errored.
    const [request] = await db.scan(deletionRequestTable, { id });
    completedByAnotherRun = request?.status === DELETION_REQUEST_STATUS.completed;
    if (!completedByAnotherRun) {
      await db.update(deletionRequestTable, { id, status: DELETION_REQUEST_STATUS.failed });
    }
  } catch (error) {
    markFailedError = error instanceof Error ? error : new Error(String(error));
  }

  let message: string;
  if (completedByAnotherRun) {
    message = `[AccountDeletion] deletion request ${id} errored, but another run already completed it, so it stays "Completed". ${detail}`;
  } else if (markFailedError === null) {
    message = `[AccountDeletion] deletion request ${id} did not complete. ${detail} Re-firing the endpoint resumes it.`;
  } else {
    message = `[AccountDeletion] deletion request ${id} did not complete, and could not be marked failed (${markFailedError.message}). ${detail} It is stuck "In progress": set its status to "Failed" in Airtable before re-firing the endpoint.`;
  }

  await slackAlert(env, [message]);

  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: detail, cause });
};
