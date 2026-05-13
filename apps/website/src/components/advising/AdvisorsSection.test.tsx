import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  describe,
  expect,
  test,
} from 'vitest';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import AdvisorsSection from './AdvisorsSection';

describe('AdvisorsSection', () => {
  test('renders advisor profile descriptions when present', async () => {
    server.use(trpcMsw.teamMembers.getOneOnOneAdvisors.query(() => [
      {
        name: 'Ada Advisor',
        jobTitle: 'AI governance lead',
        imageUrl: 'https://example.com/ada.jpg',
        url: 'https://example.com/ada',
        advisorProfileDescription: 'Useful to talk to about choosing between AI governance career paths.',
      },
      {
        name: 'Noor No Description',
        jobTitle: 'Technical advisor',
        imageUrl: 'https://example.com/noor.jpg',
        url: undefined,
        advisorProfileDescription: undefined,
      },
    ]));

    render(<AdvisorsSection />, { wrapper: TrpcProvider });

    expect(await screen.findByText('Ada Advisor')).toBeInTheDocument();
    expect(screen.getByText('Noor No Description')).toBeInTheDocument();
    expect(screen.getByText('Useful to talk to about choosing between AI governance career paths.')).toBeInTheDocument();
  });
});
