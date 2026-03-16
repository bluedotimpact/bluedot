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
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import GranteesListSection from './GranteesListSection';

const mockGrantees = [
  {
    granteeName: 'Alice',
    projectTitle: 'Alpha Project',
    amountUsd: 1000,
    projectSummary: 'Alpha summary',
    link: 'https://example.com/alpha',
  },
  {
    granteeName: 'Bob',
    projectTitle: 'Beta Project',
    amountUsd: 2000,
    projectSummary: undefined,
    link: undefined,
  },
];

describe('GranteesListSection', () => {
  test('applies scroll margin to the section and toggles hidden grants', async () => {
    server.use(trpcMsw.grants.getAllPublicGrantees.query(() => mockGrantees));

    const { container } = render(<GranteesListSection
      id="grants-made"
      title="Projects we have funded"
      limit={1}
      background="canvas"
    />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    });

    const section = container.querySelector('section#grants-made');
    expect(section?.className).toContain('scroll-mt-28');
    expect(screen.queryByText('Beta Project')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show all 2 public grants' }));

    await waitFor(() => {
      expect(screen.getByText('Beta Project')).toBeInTheDocument();
    });
  });
});
