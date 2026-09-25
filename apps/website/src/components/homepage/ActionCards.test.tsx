import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  beforeEach, describe, expect, test,
} from 'vitest';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import ActionCards from './ActionCards';

const program = {
  id: 'incubator', name: 'Incubator Week', slug: 'incubator-week', category: 'Launch',
  description: 'Catalogue description.', applicationForm: null, order: '1', status: 'Active',
};
const grants = [
  {
    ...program, id: 'rapid', name: 'Rapid Grants', slug: 'rapid-grants', category: 'Funding',
  },
  {
    ...program, id: 'career', name: 'Career Transition Grants', slug: 'career-transition-grant', category: 'Funding',
  },
];

describe('ActionCards', () => {
  beforeEach(() => {
    server.use(
      trpcMsw.programs.getGrants.query(() => grants),
      trpcMsw.programs.getInPerson.query(() => [program]),
    );
  });

  test('links all four opportunities to their canonical destinations with tracking and accessible names', async () => {
    render(<ActionCards />, { wrapper: TrpcProvider });
    expect(await screen.findByRole('link', { name: 'Rapid Grants' })).toHaveAttribute('href', '/grants/rapid?utm_source=website&utm_campaign=homepage-grants');
    expect(await screen.findByRole('link', { name: 'Career Transition Grants' })).toHaveAttribute('href', '/grants/career-transition?utm_source=website&utm_campaign=homepage-grants');
    expect(await screen.findByRole('link', { name: 'Incubator Week' })).toHaveAttribute('href', '/programs/incubator-week?utm_source=website&utm_campaign=homepage-programs');
    const bootcamp = await screen.findByRole('link', { name: 'AI Security Bootcamp (opens in a new tab)' });
    expect(bootcamp).toHaveAttribute('href', 'https://aisb.dev/?utm_source=website&utm_campaign=homepage-programs');
    expect(bootcamp).toHaveAttribute('target', '_blank');
    expect(bootcamp).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('respects catalogue removal and order, and omits grants without a public route', async () => {
    server.use(
      trpcMsw.programs.getGrants.query(() => [grants[1]!, {
        ...program, id: 'unlaunched', name: 'Unlaunched grant', slug: 'unlaunched', category: 'Funding',
      }, grants[0]!]),
      trpcMsw.programs.getInPerson.query(() => []),
    );
    render(<ActionCards />, { wrapper: TrpcProvider });
    await screen.findByRole('link', { name: 'Rapid Grants' });
    const funding = screen.getByRole('region', { name: 'Get funding' });
    expect(within(funding).getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)).toEqual([
      'Career Transition Grants',
      'Rapid Grants',
    ]);
    expect(screen.queryByText('Unlaunched grant')).not.toBeInTheDocument();
    expect(screen.queryByText('Incubator Week')).not.toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /AI Security Bootcamp/ })).toBeInTheDocument();
  });

  test('supports future catalogue entries and preserves external application query strings and fragments', async () => {
    server.use(trpcMsw.programs.getInPerson.query(() => [{
      ...program,
      id: 'new-program',
      name: 'New program',
      slug: null,
      description: 'Fresh catalogue copy.',
      applicationForm: 'https://example.com/apply?round=2#form',
    }]));
    render(<ActionCards />, { wrapper: TrpcProvider });
    const link = await screen.findByRole('link', { name: 'New program (opens in a new tab)' });
    expect(link).toHaveAttribute('href', 'https://example.com/apply?round=2&utm_source=website&utm_campaign=homepage-programs#form');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('Fresh catalogue copy.')).toBeInTheDocument();
  });
});
