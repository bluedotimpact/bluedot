import '@testing-library/jest-dom';
import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { trpc } from '../../utils/trpc';
import { createMockCourseRegistration } from '../../__tests__/testUtils';
import DropoutModal from './DropoutModal';

const mockCourseRounds = {
  intense: [],
  partTime: [],
};

const QueryWatchers = () => {
  trpc.meetPerson.getInactiveCourseRegistrations.useQuery({});
  trpc.dropout.getStatusForUser.useQuery();
  trpc.courseRegistrations.getAll.useQuery();

  return null;
};

describe('DropoutModal', () => {
  let inactiveRegistrationsRequests: number;
  let dropoutStatusRequests: number;
  let courseRegistrationsRequests: number;

  beforeEach(() => {
    inactiveRegistrationsRequests = 0;
    dropoutStatusRequests = 0;
    courseRegistrationsRequests = 0;

    server.use(
      trpcMsw.courseRounds.getRoundsForCourse.query(() => mockCourseRounds),
      trpcMsw.meetPerson.getInactiveCourseRegistrations.query(() => {
        inactiveRegistrationsRequests += 1;
        return [];
      }),
      trpcMsw.dropout.getStatusForUser.query(() => {
        dropoutStatusRequests += 1;
        return {};
      }),
      trpcMsw.courseRegistrations.getAll.query(() => {
        courseRegistrationsRequests += 1;
        return [];
      }),
      trpcMsw.dropout.dropoutOrDeferral.mutation(({ input }) => ({
        id: 'new-dropout-id',
        applicantId: [input.applicantId],
        reason: input.reason ?? null,
        type: input.type,
        newRoundId: null,
        oldRoundId: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      })),
    );
  });

  it('invalidates course dropout state after a successful request closes', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <>
        <QueryWatchers />
        <DropoutModal
          applicantId="reg-active"
          courseSlug="ai-safety"
          currentRoundId="round-active"
          handleClose={handleClose}
        />
      </>,
      { wrapper: TrpcProvider },
    );

    await waitFor(() => {
      expect(inactiveRegistrationsRequests).toBe(1);
      expect(dropoutStatusRequests).toBe(1);
      expect(courseRegistrationsRequests).toBe(1);
    });

    await user.click(screen.getByRole('button', { name: 'Action type' }));
    const actionTypeListbox = await screen.findByRole('listbox');
    await user.click(within(actionTypeListbox).getByText('Drop out of the course'));

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText(/Your dropout request has been submitted/)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Close'));

    expect(handleClose).toHaveBeenCalled();
    await waitFor(() => {
      expect(inactiveRegistrationsRequests).toBeGreaterThan(1);
      expect(dropoutStatusRequests).toBeGreaterThan(1);
      expect(courseRegistrationsRequests).toBeGreaterThan(1);
    });
  });

  it('greys out the deferral option for facilitators and still submits a drop out', async () => {
    const user = userEvent.setup();
    let submittedType: string | undefined;

    server.use(
      trpcMsw.courseRegistrations.getAll.query(() => [
        createMockCourseRegistration({ id: 'reg-facilitator', role: 'Facilitator' }),
      ]),
      trpcMsw.dropout.dropoutOrDeferral.mutation(({ input }) => {
        submittedType = input.type;
        return {
          id: 'new-dropout-id',
          applicantId: [input.applicantId],
          reason: input.reason ?? null,
          type: input.type,
          newRoundId: null,
          oldRoundId: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        };
      }),
    );

    render(
      <DropoutModal
        applicantId="reg-facilitator"
        courseSlug="ai-safety"
        currentRoundId="round-active"
        handleClose={vi.fn()}
      />,
      { wrapper: TrpcProvider },
    );

    await user.click(screen.getByRole('button', { name: 'Action type' }));
    const listbox = await screen.findByRole('listbox');
    await waitFor(() => {
      expect(within(listbox).getByRole('option', { name: 'Defer to a future round' })).toHaveClass('cursor-not-allowed');
    });

    await user.click(within(listbox).getByText('Drop out of the course'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText(/Your dropout request has been submitted/)).toBeInTheDocument();
    });
    expect(submittedType).toBe('Drop out');
  });

  it('renders the withdraw confirm for a pre-decision registration', async () => {
    const user = userEvent.setup();
    let submittedType: string | undefined;

    server.use(
      trpcMsw.courseRegistrations.getAll.query(() => [
        createMockCourseRegistration({ id: 'reg-pre', decision: null }),
      ]),
      trpcMsw.dropout.dropoutOrDeferral.mutation(({ input }) => {
        submittedType = input.type;
        return {
          id: 'new-dropout-id',
          applicantId: [input.applicantId],
          reason: input.reason ?? null,
          type: input.type,
          newRoundId: null,
          oldRoundId: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        };
      }),
    );

    render(
      <DropoutModal
        applicantId="reg-pre"
        courseSlug="ai-safety"
        currentRoundId={null}
        handleClose={vi.fn()}
      />,
      { wrapper: TrpcProvider },
    );

    // No chooser is rendered; just Cancel + Confirm.
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Action type' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByText(/Your application has been withdrawn/)).toBeInTheDocument();
    });
    expect(submittedType).toBe('Drop out');
  });
});
