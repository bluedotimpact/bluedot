import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach, expect, test, vi,
} from 'vitest';
import type { ReactNode } from 'react';

vi.mock('@bluedot/ui', () => ({ H1: ({ children }: { children: ReactNode }) => <h1>{children}</h1> }));
vi.mock('../components/SummaryCard', () => ({ SummaryCard: () => null }));
vi.mock('../components/PreviousApplicationsCard', () => ({ PreviousApplicationsCard: () => null }));

import { ApplicationCard } from '../components/ApplicationCard';

afterEach(cleanup);

const baseProps = { position: 1, total: 1, course: 'AGI Strategy' };

test('shows a dual-role badge when the person also applied to facilitate', () => {
  render(<ApplicationCard {...baseProps} application={{ id: 'recDual', name: 'Dual applicant', alsoAppliedToFacilitate: true }} />);
  expect(screen.getByText('Also applied to facilitate')).toBeTruthy();
});

test('shows no dual-role badge for participant-only applicants', () => {
  render(<ApplicationCard {...baseProps} application={{ id: 'recSolo', name: 'Solo applicant' }} />);
  expect(screen.queryByText('Also applied to facilitate')).toBeNull();
});
