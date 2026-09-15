import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
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
        subteam: undefined,
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
      subteam: undefined,
      imageUrl: `https://example.com/photo-${index + 1}.jpg`,
      url: undefined,
    }))));
    render(<TeamSection />, { wrapper: TrpcProvider });

    expect(await screen.findAllByRole('listitem')).toHaveLength(13);
    expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous slide' })).not.toBeInTheDocument();
  });

  test('groups members once each, including new and unassigned subteams', async () => {
    const members = [
      { name: 'Ada', subteam: 'Courses' },
      { name: 'Ben', subteam: 'Special Projects' },
      { name: 'Chris', subteam: 'Courses' },
      { name: 'Dara', subteam: undefined },
      { name: 'Eleni', subteam: 'New team' },
    ].map((member) => ({
      ...member,
      jobTitle: 'Team role',
      imageUrl: 'https://example.com/photo.jpg',
      url: undefined,
    }));
    server.use(trpcMsw.teamMembers.getAll.query(() => members));
    render(<TeamSection />, { wrapper: TrpcProvider });

    const courses = await screen.findByRole('list', { name: 'Courses team members' });
    expect(within(courses).getAllByRole('heading').map((heading) => heading.textContent)).toEqual(['Ada', 'Chris']);
    expect(screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)).toEqual([
      'Courses', 'Special Projects', 'New team', 'More of our team',
    ]);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('list', { name: 'More of our team team members' })).toHaveTextContent('Dara');
    expect(screen.queryByRole('heading', { name: 'Grants' })).not.toBeInTheDocument();
  });
});
