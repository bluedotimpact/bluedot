import '@testing-library/jest-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  describe,
  expect,
  test,
} from 'vitest';
import { rapidGrantTable } from '@bluedot/db';
import { createTrpcDbProvider, setupTestDb, testDb } from '../../__tests__/dbTestUtils';
import GranteesListSection from './GranteesListSection';

setupTestDb();

describe('GranteesListSection', () => {
  test('renders grantees from DB and toggles show all', async () => {
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Alice',
      projectTitle: 'Alpha Project',
      amountUsd: 1000,
      projectSummary: 'Alpha summary',
      link: 'https://example.com/alpha',
    });
    await testDb.insert(rapidGrantTable, {
      granteeName: 'Bob',
      projectTitle: 'Beta Project',
      amountUsd: 2000,
      projectSummary: null,
      link: null,
    });

    render(<GranteesListSection
      id="grants-made"
      title="Projects we have funded"
      limit={1}
    />, { wrapper: createTrpcDbProvider() });

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    });

    expect(screen.queryByText('Beta Project')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show 1 more project' }));

    await waitFor(() => {
      expect(screen.getByText('Beta Project')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show fewer projects' }));

    await waitFor(() => {
      expect(screen.queryByText('Beta Project')).not.toBeInTheDocument();
    });
  });
});
