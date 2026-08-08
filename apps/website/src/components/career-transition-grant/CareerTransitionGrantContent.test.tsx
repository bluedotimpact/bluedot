import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import GrantFaqSection from '../grants/sections/GrantFaqSection';
import ApplicationPreviewSection from './ApplicationPreviewSection';
import ExpectationsSection from './ExpectationsSection';
import NextStepsSection from './NextStepsSection';
import WhatThisIsForSection from './WhatThisIsForSection';
import WhatWeLookForSection from './WhatWeLookForSection';
import WhatYouReceiveSection from './WhatYouReceiveSection';

describe('Career Transition Grant content', () => {
  test('presents the transition thesis, evidence criteria, support, expectations, and evaluation stages', () => {
    render(<>
      <WhatThisIsForSection />
      <WhatWeLookForSection />
      <WhatYouReceiveSection />
      <ExpectationsSection />
      <ApplicationPreviewSection />
      <NextStepsSection />
    </>);

    expect(screen.getByRole('heading', { name: 'What this is for' })).toBeInTheDocument();
    expect(screen.getByText(/defined period working full-time on a transition/i)).toBeInTheDocument();
    expect(screen.queryByText(/upskilling, exploring opportunities, building your network/i)).not.toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'What we look for' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Evidence that you are already moving' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A grant that meaningfully improves the path' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clear thinking under uncertainty' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A credible connection to catastrophic-risk reduction' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Funding' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Targeted connections' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Regular progress updates' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Structured check-ins' })).toBeInTheDocument();

    expect(screen.getByText('What to prepare').closest('details')).toBeInTheDocument();
    expect(screen.getByText('Accessible work samples')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'We determine the right route' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'We review the relevant evidence' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'We interview selected applicants' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'We decide and set up the grant' })).toBeInTheDocument();
  });

  test('answers the revised applicant-routing questions', async () => {
    const user = userEvent.setup();
    render(<GrantFaqSection program="career-transition-grant" />);

    expect(screen.getByRole('button', { name: 'Who should apply?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Who is eligible?' })).not.toBeInTheDocument();

    await act(async () => user.click(screen.getByRole('button', { name: 'Do I need to be unable to transition without funding?' })));
    expect(screen.getByText(/do not require the transition to be literally impossible/i)).toBeVisible();

    await act(async () => user.click(screen.getByRole('button', { name: 'Should I apply to Rapid Grants instead?' })));
    expect(screen.getByText(/concrete project with specific costs/i)).toBeVisible();
  });
});
