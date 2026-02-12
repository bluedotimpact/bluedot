import '@testing-library/jest-dom';
import { RESOURCE_FEEDBACK, type ResourceCompletion } from '@bluedot/db/src/schema';
import { useAuthStore } from '@bluedot/ui';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import {
  beforeEach, describe, expect, it, vi, type Mock,
} from 'vitest';
import { TRPCError } from '@trpc/server';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { ResourceListItem } from './ResourceListItem';
import { createMockResource, createMockResourceCompletion } from '../../__tests__/testUtils';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    query: { courseSlug: 'test-course', unitNumber: '1' },
    pathname: '/courses/[courseSlug]/units/[unitNumber]',
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock FaviconImage component
vi.mock('./FaviconImage', () => ({
  FaviconImage: ({ url, alt }: { url: string; alt: string }) => (
    <img src={url} alt={alt} />
  ),
}));

// Mock MarkdownExtendedRenderer
vi.mock('./MarkdownExtendedRenderer', () => ({
  default: function MarkdownExtendedRenderer({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={className}>{children}</div>;
  },
}));

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

const mockedUseAuthStore = useAuthStore as unknown as Mock;

const mockAuth = { token: 'test-token', email: 'test@bluedot.org' };

describe('ResourceListItem - Listen to Article Feature', () => {
  const mockResource = createMockResource();

  it('should render metadata without Listen to article button when no audio URL', () => {
    const { container, queryByText } = render(
      <ResourceListItem resource={mockResource} />,
      { wrapper: TrpcProvider },
    );

    // Should show author, year, and time
    expect(queryByText(/John Doe/)).toBeTruthy();
    expect(queryByText(/2024/)).toBeTruthy();
    expect(queryByText(/10 min/)).toBeTruthy();

    // Should NOT show Listen to article
    expect(queryByText('Listen to article')).toBeFalsy();

    expect(container.querySelector('.resource-item__bottom-metadata')).toMatchSnapshot();
  });

  it('should render Listen to article button when audio URL is provided', () => {
    const resourceWithAudio = {
      ...mockResource,
      syncedAudioUrl: 'https://open.spotify.com/episode/abc123',
    };

    const { container, getByText } = render(
      <ResourceListItem resource={resourceWithAudio} />,
      { wrapper: TrpcProvider },
    );

    // Should show author, time, and Listen to article
    expect(getByText(/John Doe/)).toBeTruthy();
    expect(getByText(/10 min/)).toBeTruthy();
    expect(getByText('Listen to article')).toBeTruthy();

    expect(container.querySelector('.resource-item__bottom-metadata')).toMatchSnapshot();
  });

  it('should render Listen to article with proper separator when metadata exists', () => {
    const resourceWithAudio = {
      ...mockResource,
      authors: 'Jane Smith',
      timeFocusOnMins: 15,
      syncedAudioUrl: 'https://open.spotify.com/episode/xyz789',
    };

    const { container } = render(
      <ResourceListItem resource={resourceWithAudio} />,
      { wrapper: TrpcProvider },
    );

    const metadata = container.querySelector('.resource-item__bottom-metadata');
    expect(metadata).toMatchSnapshot();

    // Check that separators are rendered
    const textContent = metadata?.textContent;
    expect(textContent).toContain('Jane Smith');
    expect(textContent).toContain('·');
    expect(textContent).toContain('15 min');
    expect(textContent).toContain('Listen to article');
  });

  it('should render Listen to article even without other metadata', () => {
    const resourceWithOnlyAudio = {
      ...mockResource,
      authors: null,
      timeFocusOnMins: null,
      syncedAudioUrl: 'https://open.spotify.com/episode/solo123',
    };

    const { container, getByText } = render(
      <ResourceListItem resource={resourceWithOnlyAudio} />,
      { wrapper: TrpcProvider },
    );

    // Should show Listen to article button even when no other metadata
    expect(getByText('Listen to article')).toBeTruthy();

    // Should show year and separator before audio button
    const metadata = container.querySelector('.resource-item__bottom-metadata');
    expect(metadata?.textContent).toContain('2024');
    expect(metadata?.textContent).toContain('·');
    expect(metadata?.textContent).toContain('Listen to article');

    expect(metadata).toMatchSnapshot();
  });

  it('should handle various metadata combinations with audio URL', () => {
    // Only author and audio
    const authorAndAudio = {
      ...mockResource,
      authors: 'Alice Brown',
      timeFocusOnMins: null,
      syncedAudioUrl: 'https://open.spotify.com/episode/author123',
    };

    const { container: container1 } = render(
      <ResourceListItem resource={authorAndAudio} />,
      { wrapper: TrpcProvider },
    );
    expect(container1.querySelector('.resource-item__bottom-metadata')).toMatchSnapshot();

    // Only time and audio
    const timeAndAudio = {
      ...mockResource,
      authors: null,
      timeFocusOnMins: 20,
      syncedAudioUrl: 'https://open.spotify.com/episode/time123',
    };

    const { container: container2 } = render(
      <ResourceListItem resource={timeAndAudio} />,
      { wrapper: TrpcProvider },
    );
    expect(container2.querySelector('.resource-item__bottom-metadata')).toMatchSnapshot();
  });

  it('should display year field correctly in metadata', () => {
    const { queryByText } = render(
      <ResourceListItem resource={mockResource} />,
      { wrapper: TrpcProvider },
    );

    // Should show year between author and time
    expect(queryByText(/2024/)).toBeTruthy();
  });

  it('should handle metadata without year field', () => {
    const resourceWithoutYear = {
      ...mockResource,
      year: null,
    };

    const { container, queryByText } = render(
      <ResourceListItem resource={resourceWithoutYear} />,
      { wrapper: TrpcProvider },
    );

    // Should show author and time but not year
    expect(queryByText(/John Doe/)).toBeTruthy();
    expect(queryByText(/10 min/)).toBeTruthy();
    expect(queryByText(/2024/)).toBeFalsy();

    // Check proper separator handling without year
    const metadata = container.querySelector('.resource-item__bottom-metadata');
    const textContent = metadata?.textContent;
    expect(textContent).toContain('John Doe');
    expect(textContent).toContain('·');
    expect(textContent).toContain('10 min');
  });

  it('should handle only year field in metadata', () => {
    const resourceWithOnlyYear = {
      ...mockResource,
      authors: null,
      timeFocusOnMins: null,
    };

    const { container, queryByText } = render(
      <ResourceListItem resource={resourceWithOnlyYear} />,
      { wrapper: TrpcProvider },
    );

    // Should show only year
    expect(queryByText(/2024/)).toBeTruthy();
    expect(queryByText(/John Doe/)).toBeFalsy();
    expect(queryByText(/10 min/)).toBeFalsy();

    // Should not have separators when only year is present
    const metadata = container.querySelector('.resource-item__bottom-metadata');
    expect(metadata?.textContent).not.toContain('·');
  });
});

describe('ResourceListItem - Optimistic Updates', () => {
  const mockResource = createMockResource();
  const mockResourceCompletion = createMockResourceCompletion({ resourceFeedback: RESOURCE_FEEDBACK.NO_RESPONSE });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuthStore.mockImplementation((selector) => selector({ auth: mockAuth }));
  });

  it('should optimistically mark as complete before server responds', async () => {
    const user = userEvent.setup();

    let resolveMutation: (value: ResourceCompletion) => void = () => {};
    const mutationPendingPromise = new Promise<ResourceCompletion>((resolve) => {
      resolveMutation = resolve;
    });

    server.use(trpcMsw.resources.saveResourceCompletion.mutation(async () => {
      const result = await mutationPendingPromise;
      return {
        ...result,
        feedback: result.feedback?.trimEnd(),
      };
    }));

    render(<ResourceListItem resource={mockResource} resourceCompletion={mockResourceCompletion} />, { wrapper: TrpcProvider });

    const toggleButton = await screen.findByLabelText('Mark as complete');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Mark as incomplete')).toBeInTheDocument();
    });

    resolveMutation({ ...mockResourceCompletion, isCompleted: true });

    // UI stays in same state after mutation resolves
    await waitFor(() => {
      expect(screen.getByLabelText('Mark as incomplete')).toBeInTheDocument();
    });
  });

  it('should optimistically update feedback selection', async () => {
    const user = userEvent.setup();

    // Start with a completed resource so we can see the feedback buttons
    const completedMock = { ...mockResourceCompletion, isCompleted: true };

    let resolveMutation: (value: typeof completedMock) => void = () => {};
    const mutationPendingPromise = new Promise<typeof completedMock>((resolve) => {
      resolveMutation = resolve;
    });

    server.use(trpcMsw.resources.saveResourceCompletion.mutation(async () => {
      const result = await mutationPendingPromise;
      return {
        ...result,
        feedback: result.feedback?.trimEnd(),
      };
    }));

    render(<ResourceListItem resource={mockResource} resourceCompletion={completedMock} />, { wrapper: TrpcProvider });

    // Wait for the feedback section to appear (it appears when isCompleted is true)
    await screen.findByRole('region', { name: 'Resource feedback section' });

    // `getAll` since there are two buttons - one for mobile and one for desktop
    const likeButton = screen.getAllByLabelText('Like this resource')[0];
    if (!likeButton) {
      throw new Error('Like button not found');
    }

    await user.click(likeButton);

    await waitFor(() => {
      expect(likeButton).toHaveAttribute('aria-pressed', 'true');
    });

    resolveMutation({ ...completedMock, resourceFeedback: RESOURCE_FEEDBACK.LIKE });

    // UI is in same state after mutation resolves
    await waitFor(() => {
      expect(likeButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('should revert optimistic update if mutation fails', async () => {
    const user = userEvent.setup();
    let rejectMutation: (error: TRPCError) => void = () => {};
    const mutationPendingPromise = new Promise((_, reject) => {
      rejectMutation = reject;
    });

    server.use(trpcMsw.resources.saveResourceCompletion.mutation(async () => {
      await mutationPendingPromise; // This line will throw when we call rejectMutation()
      const result = { ...mockResourceCompletion, isCompleted: true };
      return {
        ...result,
        feedback: result.feedback?.trimEnd(),
      }; // Unreachable
    }));

    render(<ResourceListItem resource={mockResource} resourceCompletion={mockResourceCompletion} />, { wrapper: TrpcProvider });

    const toggleButton = await screen.findByLabelText('Mark as complete');
    await user.click(toggleButton);

    // Optimistic update
    await waitFor(() => {
      expect(screen.getByLabelText('Mark as incomplete')).toBeInTheDocument();
    });

    // Trigger rejection
    rejectMutation(new TRPCError({ code: 'INTERNAL_SERVER_ERROR' }));

    // Verify rollback
    await waitFor(() => {
      expect(screen.getByLabelText('Mark as complete')).toBeInTheDocument();
    });
  });
});
