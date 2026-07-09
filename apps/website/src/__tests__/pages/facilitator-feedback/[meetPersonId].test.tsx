import '@testing-library/jest-dom';
import {
  act, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { focusManager } from '@tanstack/react-query';
import { TRPCError } from '@trpc/server';
import {
  beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import FacilitatorFeedbackPage from '../../../pages/facilitator-feedback/[meetPersonId]';
import { TrpcProvider } from '../../trpcProvider';
import { server, trpcMsw } from '../../trpcMswSetup';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  query: { meetPersonId: 'rec-facilitator' },
  isReady: true,
  asPath: '/facilitator-feedback/rec-facilitator',
  pathname: '/facilitator-feedback/[meetPersonId]',
  push: vi.fn(),
  replace: vi.fn(),
};

const mockUser = {
  id: 'rec-user',
  createdAt: null,
  email: 'facilitator@example.com',
  name: 'Test Facilitator',
  autoNumberId: null,
  lastSeenAt: null,
  firstLoggedInAt: null,
  utmSource: null,
  utmCampaign: null,
  utmContent: null,
  isAdmin: false,
  keycloakIdentifier: null,
  allowedImpersonationTargets: null,
};

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  server.use(trpcMsw.users.getUser.query(() => mockUser));
});

const stubFeedbackFormData = {
  meetPersonId: 'rec-facilitator',
  firstName: 'Test',
  lastName: 'Facilitator',
  email: 'facilitator@example.com',
  payForFacilitatedDiscussions: null,
  roundName: 'Test Round',
  roundStartDate: null,
  roundLastDiscussionDate: null,
  groupIds: ['rec-group'],
  followUpOptions: [],
  participants: [{ id: 'rec-participant', name: 'Participant One' }],
  dropIns: [],
  existingCourseFeedback: {
    id: 'rec-course-feedback',
    courseRating: null,
    courseValue: null,
    improvements: null,
    completed: null,
  },
  existingPeerFeedback: [],
};

const emptyFeedbackFormData = {
  ...stubFeedbackFormData,
  existingCourseFeedback: null,
};

const draftFeedbackFormData = {
  ...stubFeedbackFormData,
  existingCourseFeedback: {
    ...stubFeedbackFormData.existingCourseFeedback,
    courseRating: 4,
    courseValue: 'Existing value',
    improvements: 'Existing difficulty',
  },
};

describe('FacilitatorFeedbackPage', () => {
  test('renders an error fallback when getFeedbackFormData fails with a non-404 error', async () => {
    server.use(trpcMsw.facilitators.getFeedbackFormData.query(() => {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'boom' });
    }));

    render(<FacilitatorFeedbackPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/Error:/i);
    });
  });

  test('preserves course-level edits when a stub course feedback row refetches after first hydration', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    let returnStubFeedback = false;
    server.use(trpcMsw.facilitators.getFeedbackFormData.query(() => {
      requestCount += 1;
      return returnStubFeedback ? stubFeedbackFormData : emptyFeedbackFormData;
    }));

    render(<FacilitatorFeedbackPage />, { wrapper: TrpcProvider });

    const mostValuable = await screen.findByLabelText(/What did you find most valuable/i);
    const difficulties = screen.getByLabelText(/Where did you face difficulties/i);

    await user.type(mostValuable, 'AAA');
    await user.type(difficulties, 'BBB');
    fireEvent.click(screen.getByRole('button', { name: 'Rate 3 stars' }));

    const initialRequestCount = requestCount;
    returnStubFeedback = true;
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(initialRequestCount);
    });

    expect(mostValuable).toHaveValue('AAA');
    expect(difficulties).toHaveValue('BBB');
    expect(screen.getByRole('button', { name: 'Rate 3 stars' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('hydrates uncompleted course feedback fields on first load', async () => {
    server.use(trpcMsw.facilitators.getFeedbackFormData.query(() => draftFeedbackFormData));

    render(<FacilitatorFeedbackPage />, { wrapper: TrpcProvider });

    expect(await screen.findByLabelText(/What did you find most valuable/i)).toHaveValue('Existing value');
    expect(screen.getByLabelText(/Where did you face difficulties/i)).toHaveValue('Existing difficulty');
    expect(screen.getByRole('button', { name: 'Rate 4 stars' })).toHaveAttribute('aria-pressed', 'true');
  });
});
