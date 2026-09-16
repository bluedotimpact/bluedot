import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { server, trpcMsw } from '../../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../../__tests__/trpcProvider';
import { ProjectSubmission } from './ProjectSubmission';

vi.mock('next/router', () => ({
  useRouter: () => ({ query: { courseSlug: 'technical-ai-safety' } }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderWithStatus = (status: any) => {
  server.use(trpcMsw.certificates.getStatus.query(() => status));
  return render(<ProjectSubmission courseId="course-1" />, { wrapper: TrpcProvider });
};

const certificate = {
  certificateId: 'cert-1',
  certificateCreatedAt: 1760000000,
  recipientName: 'Test Person',
  courseName: 'Technical AI Safety',
  courseSlug: 'technical-ai-safety',
  courseDetailsUrl: '',
  certificationDescription: '',
};

const expectSubmitButton = async () => {
  const link = await screen.findByRole('link', { name: /Submit your project\/action plan/ });
  expect(link).toHaveAttribute('href', expect.stringContaining('prefill_Participant=recMeetPerson1'));
  expect(link).toHaveAttribute('target', '_blank');
};

describe('ProjectSubmission', () => {
  describe('anyone with a Meet person id can submit', () => {
    test('a participant part-way through the course', async () => {
      renderWithStatus({
        status: 'action-plan-pending' as const,
        meetPersonId: 'recMeetPerson1',
        hasSubmittedActionPlan: false,
        hasAtMostOneDiscussionLeft: false,
      });

      await expectSubmitButton();
    });

    test('a participant who has missed too many discussions to be eligible', async () => {
      renderWithStatus({
        status: 'attendance-ineligible' as const,
        uniqueDiscussionAttendance: 1,
        discussionsHeld: 4,
        meetPersonId: 'recMeetPerson1',
        hasSubmittedActionPlan: false,
      });

      await expectSubmitButton();
    });
  });

  describe('a submission on record replaces the button', () => {
    test('while the plan is still awaiting review', async () => {
      renderWithStatus({
        status: 'action-plan-pending' as const,
        meetPersonId: 'recMeetPerson1',
        hasSubmittedActionPlan: true,
        hasAtMostOneDiscussionLeft: true,
      });

      expect(await screen.findByText('Project/action plan submitted')).toBeInTheDocument();
      // A second trip through the form would create a duplicate submission record, not an edit.
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('and once the certificate has been issued', async () => {
      renderWithStatus({
        status: 'has-certificate' as const,
        ...certificate,
        meetPersonId: 'recMeetPerson1',
        hasSubmittedActionPlan: true,
      });

      expect(await screen.findByText('Project/action plan submitted')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('without a Meet person id', () => {
    test('people outside a cohort are pointed at the next round', async () => {
      renderWithStatus({ status: 'not-enrolled' as const, hasUpcomingRounds: true });

      expect(await screen.findByRole('link', { name: /Join a facilitated cohort today/ }))
        .toHaveAttribute('href', '/courses/technical-ai-safety/congratulations');
    });

    test('nothing renders for facilitators, who the congratulations page turns away', async () => {
      renderWithStatus({ status: 'is-facilitator' as const, hasUpcomingRounds: true });

      await expect(screen.findByRole('link')).rejects.toThrow();
    });

    test('an accepted applicant who is not yet rostered is pointed at the next round', async () => {
      renderWithStatus({ status: 'not-eligible' as const, hasUpcomingRounds: true });

      expect(await screen.findByRole('link', { name: /Join a facilitated cohort today/ })).toBeInTheDocument();
    });

    test('nothing renders when no rounds are coming up, since that page would redirect', async () => {
      renderWithStatus({ status: 'not-enrolled' as const, hasUpcomingRounds: false });

      await expect(screen.findByRole('link')).rejects.toThrow();
    });

    test('nothing renders for logged out visitors with no rounds to join', async () => {
      renderWithStatus({ status: 'not-authenticated' as const, hasUpcomingRounds: false });

      await expect(screen.findByRole('link')).rejects.toThrow();
    });
  });
});
