import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test } from 'vitest';
import { SidebarCertificatePanel } from './SidebarCertificatePanel';

describe('SidebarCertificatePanel', () => {
  test('uses the Digital Minds external learn-more CTA for unenrolled users', () => {
    render(<SidebarCertificatePanel
      courseTitle="Introduction to Digital Minds"
      courseSlug="digital-minds"
      certificateData={{ status: 'not-enrolled' }}
    />);

    const link = screen.getByRole('link', { name: 'Learn more about this course' });

    expect(link).toHaveAttribute('href', 'https://digitalminds.cam/course');
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('keeps the default certificate CTA for other courses', () => {
    render(<SidebarCertificatePanel
      courseTitle="AGI Strategy"
      courseSlug="agi-strategy"
      certificateData={{ status: 'not-enrolled' }}
    />);

    const link = screen.getByRole('link', {
      name: /AGI Strategy Certificate Join a facilitated cohort today/i,
    });

    expect(link).toHaveAttribute('href', '/courses/agi-strategy/congratulations');
  });
});
