import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  exerciseResponsePgTable, exerciseTable, unitTable, userTable,
} from '@bluedot/db';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import AdminExercisesPage from '../../../pages/admin/exercises';
import {
  createTrpcDbProvider, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../dbTestUtils';

const routerReplace = vi.fn();
const routerPush = vi.fn();
let routerQuery: Record<string, string> = {};

vi.mock('next/router', () => ({
  useRouter: () => ({
    query: routerQuery,
    replace: routerReplace,
    push: routerPush,
  }),
}));

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Permission checks resolve the caller by sub (keycloakIdentifier), so callers are keyed on sub.
const ctxFor = (sub: string) => ({
  ...testAuthContextLoggedIn,
  auth: { ...testAuthContextLoggedIn.auth!, sub },
});

const ADMIN_SUB = 'admin-sub';
const ADMIN_EMAIL = 'admin@example.com';
const TARGET_EMAIL = 'target@example.com';

async function seedAdminAndTarget() {
  await testDb.insert(userTable, {
    id: 'admin-id', email: ADMIN_EMAIL, name: 'Admin', isAdmin: true, keycloakIdentifier: ADMIN_SUB,
  });
  await testDb.insert(userTable, {
    id: 'target-id', email: TARGET_EMAIL, name: 'Target',
  });
}

async function seedTargetResponses() {
  await testDb.insert(unitTable, {
    id: 'unit-a', courseId: 'course-a', courseTitle: 'Alignment', courseSlug: 'alignment', title: 'Intro', unitNumber: '1', unitStatus: 'Published',
  });
  await testDb.insert(unitTable, {
    id: 'unit-b', courseId: 'course-b', courseTitle: 'Governance', courseSlug: 'governance', title: 'Intro', unitNumber: '1', unitStatus: 'Published',
  });
  await testDb.insert(exerciseTable, {
    id: 'ex-a1', courseId: 'course-a', unitId: 'unit-a', title: 'Alignment week 1 prompt', exerciseNumber: '1.1', type: 'Free text',
  });
  await testDb.insert(exerciseTable, {
    id: 'ex-a2', courseId: 'course-a', unitId: 'unit-a', title: 'Alignment unique-title prompt', exerciseNumber: '1.2', type: 'Free text',
  });
  await testDb.insert(exerciseTable, {
    id: 'ex-b1', courseId: 'course-b', unitId: 'unit-b', title: 'Governance prompt', exerciseNumber: '1.1', type: 'Free text',
  });
  await testDb.pg.insert(exerciseResponsePgTable.pg).values({
    id: 'resp-a1', userId: ['target-id'], exerciseId: 'ex-a1', response: 'thinking about safety mechanisms', createdAt: '2026-04-30T10:00:00Z', completedAt: '2026-05-01T10:00:00Z',
  });
  await testDb.pg.insert(exerciseResponsePgTable.pg).values({
    id: 'resp-a2', userId: ['target-id'], exerciseId: 'ex-a2', response: 'draft in progress', createdAt: '2026-05-03T10:00:00Z', completedAt: null,
  });
  await testDb.pg.insert(exerciseResponsePgTable.pg).values({
    id: 'resp-b1', userId: ['target-id'], exerciseId: 'ex-b1', response: 'policy considerations are important', createdAt: '2026-04-29T10:00:00Z', completedAt: '2026-05-02T10:00:00Z',
  });
}

describe('/admin/exercises', () => {
  setupTestDb();

  beforeEach(() => {
    routerReplace.mockClear();
    routerPush.mockClear();
    routerQuery = {};
    // The page writes filter state into window.location.search via history.replaceState;
    // reset between tests so search/course filters don't leak across cases.
    window.history.replaceState({}, '', '/admin/exercises');
  });

  test('non-admin is redirected to /404', async () => {
    await testDb.insert(userTable, {
      id: 'regular-id', email: 'regular@example.com', name: 'Regular', keycloakIdentifier: 'regular-sub',
    });

    render(<AdminExercisesPage />, { wrapper: createTrpcDbProvider(ctxFor('regular-sub')) });

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith('/404');
    });
  });

  test('selecting a user via the modal navigates with their userId', async () => {
    await seedAdminAndTarget();
    const user = userEvent.setup();
    render(<AdminExercisesPage />, { wrapper: createTrpcDbProvider(ctxFor(ADMIN_SUB)) });

    const selectButton = await screen.findByRole('button', { name: 'Select user' });
    await user.click(selectButton);

    // The modal renders one button per result; pick the Target row by name.
    const targetRow = (await screen.findByText('Target')).closest('button');
    await user.click(targetRow!);

    expect(routerPush).toHaveBeenCalledWith({ pathname: '/admin/exercises', query: { userId: 'target-id' } });
  });

  test('selecting a course narrows results; All courses brings them back', async () => {
    await seedAdminAndTarget();
    await seedTargetResponses();
    routerQuery = { userId: 'target-id' };
    const user = userEvent.setup();
    render(<AdminExercisesPage />, { wrapper: createTrpcDbProvider(ctxFor(ADMIN_SUB)) });

    await waitFor(() => {
      expect(screen.getByText(/thinking about safety mechanisms/)).toBeInTheDocument();
      expect(screen.getByText(/policy considerations are important/)).toBeInTheDocument();
    });

    const alignmentRadio = screen.getByRole('radio', { name: 'Alignment' });
    await user.click(alignmentRadio);

    // This used to be flaky (#2716), fixed by moving the 'thinking about safety mechanisms' expect into the waitFor
    await waitFor(() => {
      expect(screen.queryByText(/policy considerations are important/)).not.toBeInTheDocument();
      expect(screen.getByText(/thinking about safety mechanisms/)).toBeInTheDocument();
    });

    const allCoursesRadio = screen.getByRole('radio', { name: 'All courses' });
    await user.click(allCoursesRadio);

    await waitFor(() => {
      expect(screen.getByText(/policy considerations are important/)).toBeInTheDocument();
    });
  });

  test('search matches both response body and exercise title', async () => {
    await seedAdminAndTarget();
    await seedTargetResponses();
    routerQuery = { userId: 'target-id' };
    const user = userEvent.setup();
    render(<AdminExercisesPage />, { wrapper: createTrpcDbProvider(ctxFor(ADMIN_SUB)) });

    const searchInput = await screen.findByPlaceholderText(/Search question or response/);

    // Body-text match
    await user.type(searchInput, 'policy');
    await waitFor(() => {
      expect(screen.getByText(/policy considerations are important/)).toBeInTheDocument();
      expect(screen.queryByText(/thinking about safety mechanisms/)).not.toBeInTheDocument();
    });

    // Title match (exercise title contains 'Alignment week 1'; the response body does not)
    await user.clear(searchInput);
    await user.type(searchInput, 'Alignment week 1');
    await waitFor(() => {
      expect(screen.getByText(/thinking about safety mechanisms/)).toBeInTheDocument();
      expect(screen.queryByText(/policy considerations are important/)).not.toBeInTheDocument();
    });
  });

  test('query errors render an ErrorSection rather than crashing', async () => {
    await seedAdminAndTarget();
    routerQuery = { userId: 'nonexistent-id' };
    render(<AdminExercisesPage />, { wrapper: createTrpcDbProvider(ctxFor(ADMIN_SUB)) });

    // Both metaQuery and exerciseResponseQuery error with NOT_FOUND; each renders an ErrorSection.
    const headings = await screen.findAllByRole('heading', { name: /User not found/ });
    expect(headings.length).toBeGreaterThan(0);
  });

  test('default view hides in-progress drafts; toggling Show in-progress reveals them', async () => {
    await seedAdminAndTarget();
    await seedTargetResponses();
    routerQuery = { userId: 'target-id' };
    const user = userEvent.setup();
    render(<AdminExercisesPage />, { wrapper: createTrpcDbProvider(ctxFor(ADMIN_SUB)) });

    await waitFor(() => {
      expect(screen.getByText(/thinking about safety mechanisms/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/draft in progress/)).not.toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /Show in-progress/ });
    await user.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText(/draft in progress/)).toBeInTheDocument();
    });

    await user.click(checkbox);

    await waitFor(() => {
      expect(screen.queryByText(/draft in progress/)).not.toBeInTheDocument();
    });
  });
});
