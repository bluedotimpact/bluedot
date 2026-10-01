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

test('shows each matching option as a tile in its tone', () => {
  render(<ApplicationCard {...baseProps} application={{
    id: 'recTiles',
    name: 'Tiled applicant',
    tiles: [{ id: 'recSampleFilterA', label: 'Sample filter A', tone: 'caution' }, { id: 'recSampleFilterB', label: 'Sample filter B', tone: 'neutral' }],
  }}
  />);
  const tiles = screen.getByRole('list', { name: 'Tags' }).querySelectorAll('li');
  expect([...tiles].map((tile) => tile.textContent)).toEqual(['Sample filter A', 'Sample filter B']);
  expect(tiles[0]!.className).toContain('bg-warning-bg');
  expect(tiles[1]!.className).toContain('bg-tint');
});

test('shows no tile list when nothing matches', () => {
  render(<ApplicationCard {...baseProps} application={{ id: 'recPlain', name: 'Plain applicant' }} />);
  expect(screen.queryByRole('list', { name: 'Tags' })).toBeNull();
});
