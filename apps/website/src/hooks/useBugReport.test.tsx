import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  beforeEach, describe, expect, it,
} from 'vitest';
import { server, trpcMsw } from '../__tests__/trpcMswSetup';
import { TrpcProvider } from '../__tests__/trpcProvider';
import BugReportProvider, { useBugReport } from './useBugReport';

const OpenButton = () => {
  const { openBugReport } = useBugReport();
  return <button type="button" onClick={openBugReport}>Open</button>;
};

const renderProvider = () => render(<TrpcProvider>
  <BugReportProvider>
    <OpenButton />
  </BugReportProvider>
</TrpcProvider>);

const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Description'), 'Something is broken');
  await user.type(screen.getByPlaceholderText('Email'), 'user@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
};

describe('BugReportProvider page URL capture', () => {
  let capturedPageUrl: string | undefined;

  beforeEach(() => {
    capturedPageUrl = undefined;
    // Birdie setup only runs on wide viewports; ensure the effect registers window.birdieSettings.
    window.innerWidth = 1024;
    server.use(trpcMsw.feedback.submitBugReport.mutation(({ input }) => {
      capturedPageUrl = input.pageUrl;
      return null;
    }));
  });

  it('captures the page the report was opened from', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/courses/agi-safety/2');
    renderProvider();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await fillAndSubmit(user);

    expect(capturedPageUrl).toBe(`${window.location.origin}/courses/agi-safety/2`);
  });

  it('captures the page recording stopped on, not the page the report was opened from', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/page-a');
    renderProvider();

    await user.click(screen.getByRole('button', { name: 'Open' }));

    // User navigates while the modal is closed and they record their screen, then stops recording.
    window.history.pushState({}, '', '/page-b');
    act(() => {
      window.birdieSettings?.onRecordingPosted?.('https://recording.example/xyz');
    });

    await fillAndSubmit(user);

    expect(capturedPageUrl).toBe(`${window.location.origin}/page-b`);
  });
});
