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
  test('keeps repeat awards for the same recipient and project distinct when sorting', async () => {
    await Promise.all([
      { amountUsd: 100, grantDate: '2026-09-19' },
      { amountUsd: 200, grantDate: '2026-09-18' },
      { amountUsd: 300, grantDate: '2026-09-17' },
    ].map((grant) => testDb.insert(rapidGrantTable, {
      granteeName: 'Repeat recipient', projectTitle: 'Repeat project', ...grant,
    })));

    render(<GranteesListSection heading="Projects we've funded" layout="editorial" limit={2} />, { wrapper: createTrpcDbProvider() });
    await screen.findByText('$100');
    const sort = screen.getByRole('combobox', { name: 'Sort projects' });
    fireEvent.change(sort, { target: { value: 'largest' } });
    expect(screen.getByText('$300')).toBeInTheDocument();
    expect(screen.queryByText('$100')).not.toBeInTheDocument();
    fireEvent.change(sort, { target: { value: 'newest' } });
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
    expect(screen.queryByText('$300')).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  test('sorts all projects before limiting and preserves the selected order when expanded', async () => {
    await Promise.all([
      { projectTitle: 'Newest project', amountUsd: null, grantDate: '2026-09-19' },
      { projectTitle: 'Zero amount project', amountUsd: 0, grantDate: '2026-09-18' },
      { projectTitle: 'Large recent project', amountUsd: 20000, grantDate: '2026-09-17' },
      { projectTitle: 'Large older project', amountUsd: 20000, grantDate: '2026-09-16' },
    ].map((grant) => testDb.insert(rapidGrantTable, { granteeName: 'Grantee', ...grant })));

    render(<GranteesListSection heading="Projects we've funded" layout="editorial" limit={1} />, { wrapper: createTrpcDbProvider() });

    await screen.findByRole('heading', { name: 'Newest project' });
    const sort = screen.getByRole('combobox', { name: 'Sort projects' });
    expect(sort).toHaveValue('newest');
    fireEvent.change(sort, { target: { value: 'largest' } });
    expect(screen.getByRole('heading', { name: 'Large recent project' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Newest project' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show 3 more projects' }));
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Large recent project', 'Large older project', 'Zero amount project', 'Newest project',
    ]);

    fireEvent.change(sort, { target: { value: 'newest' } });
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Newest project', 'Zero amount project', 'Large recent project', 'Large older project',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Show fewer projects' }));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Newest project' })).toBeInTheDocument();
  });

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
