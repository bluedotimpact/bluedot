import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { SummaryCard } from '../components/SummaryCard';

afterEach(cleanup);

test('shows N/A for the summary and scores when there is no AI evaluation', () => {
  render(<SummaryCard aiSummary="" course="Technical AI Safety" />);
  // Summary text plus the Commitment, Impressiveness, and Technical skill pills.
  expect(screen.getAllByText('N/A')).toHaveLength(4);
});

test('shows real values when the evaluation exists', () => {
  render(<SummaryCard aiSummary="SUMMARY: Solid candidate." course="AGI Strategy" commitmentScore={4} impressivenessScore={3} />);
  expect(screen.getByText('Solid candidate.')).toBeTruthy();
  expect(screen.getByText('4/5')).toBeTruthy();
  expect(screen.getByText('3/5')).toBeTruthy();
  expect(screen.queryByText('N/A')).toBeNull();
});
