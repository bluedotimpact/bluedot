import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import StorySection from './StorySection';

describe('StorySection', () => {
  test('renders default as expected', async () => {
    server.use(trpcMsw.teamMembers.getActiveCount.query(() => 17));
    const { container } = render(<StorySection />, { wrapper: TrpcProvider });

    await screen.findByText(/a team of 17/);

    expect(container).toMatchSnapshot();
  });
});
