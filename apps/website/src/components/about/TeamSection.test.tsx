import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  describe,
  expect,
  test,
} from 'vitest';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import TeamSection from './TeamSection';

describe('TeamSection', () => {
  test('renders as expected', async () => {
    server.use(trpcMsw.teamMembers.getAll.query(() => [
      {
        name: 'Test Person',
        jobTitle: 'CEO',
        imageUrl: 'https://example.com/photo.jpg',
        url: 'https://linkedin.com/in/test',
      },
    ]));
    const { container } = render(<TeamSection />, { wrapper: TrpcProvider });

    expect(await screen.findByRole('list', { name: 'Team members' })).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });

  test('shows the full team without carousel navigation', async () => {
    server.use(trpcMsw.teamMembers.getAll.query(() => Array.from({ length: 13 }, (_, index) => ({
      name: `Team member ${index + 1}`,
      jobTitle: 'Team role',
      imageUrl: `https://example.com/photo-${index + 1}.jpg`,
      url: undefined,
    }))));
    render(<TeamSection />, { wrapper: TrpcProvider });

    expect(await screen.findAllByRole('listitem')).toHaveLength(13);
    expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous slide' })).not.toBeInTheDocument();
  });
});
