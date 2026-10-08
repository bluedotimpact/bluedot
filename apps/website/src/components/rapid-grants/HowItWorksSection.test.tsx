import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import HowItWorksSection from './HowItWorksSection';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';

vi.mock('../../lib/hooks/useApplicationUrl', () => ({ useApplicationUrl: () => 'https://example.com/apply' }));

describe('HowItWorksSection', () => {
  test.each([
    [5.26, 'On average we make a decision in 5 days.'],
    [0, 'On average we make a decision within a day.'],
    [null, 'We review your application and email you a decision.'],
  ])('displays the Airtable mean (%s) without a percentile claim', async (averageDaysToDecision, expected) => {
    server.use(trpcMsw.grants.getRapidGrantStats.query(() => ({ count: 1004, totalAmountUsd: 2691905.71, averageDaysToDecision })));

    render(<HowItWorksSection />, { wrapper: TrpcProvider });

    expect(await screen.findByText(expected)).toBeVisible();
    expect(screen.queryByText(/9 in 10/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Apply' })).toHaveAttribute('href', 'https://example.com/apply');
  });

  test('keeps the process visible when the aggregate feed is unavailable', async () => {
    server.use(trpcMsw.grants.getRapidGrantStats.query(() => null));
    render(<HowItWorksSection />, { wrapper: TrpcProvider });
    expect(await screen.findByText('We review your application and email you a decision.')).toBeVisible();
    expect(screen.queryByText(/On average/)).not.toBeInTheDocument();
  });
});
