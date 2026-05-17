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
});
