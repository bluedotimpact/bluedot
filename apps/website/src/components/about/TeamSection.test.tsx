import { render } from '@testing-library/react';
import {
  describe,
  expect,
  test,
} from 'vitest';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import TeamSection from './TeamSection';

describe('TeamSection', () => {
  test('renders as expected', () => {
    server.use(trpcMsw.teamMembers.getAll.query(() => [
      {
        name: 'Test Person',
        jobTitle: 'CEO',
        imageUrl: 'https://example.com/photo.jpg',
        url: 'https://linkedin.com/in/test',
      },
    ]));
    const { container } = render(<TeamSection />, { wrapper: TrpcProvider });
    expect(container).toMatchSnapshot();
  });
});
