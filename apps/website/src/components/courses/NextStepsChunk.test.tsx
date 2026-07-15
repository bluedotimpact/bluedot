import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { getNextStepsChunkTitle } from '../../lib/constants';
import NextStepsChunk from './NextStepsChunk';

describe('NextStepsChunk', () => {
  test.each([
    'digital-minds',
    'introduction-to-digital-minds',
    'cambridge-digital-minds',
  ])('uses the Digital Minds next-steps heading for the %s slug', (courseSlug) => {
    expect(getNextStepsChunkTitle(courseSlug)).toBe('Next steps');
  });

  test('renders Cambridge Digital Minds next steps for the Digital Minds course', () => {
    render(<NextStepsChunk courseSlug="digital-minds" />);

    expect(screen.getByText(/Congratulations on finishing the Introduction to Digital Minds course!/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cambridge Digital Minds Newsletter' })).toHaveAttribute('href', 'https://www.digitalminds.news/');
    expect(screen.getByRole('link', { name: 'Cambridge Digital Minds Fellowship' })).toHaveAttribute('href', 'https://digitalminds.cam/fellowship/');
    expect(screen.getByRole('link', { name: 'Beginner’s Guide to Digital Minds' })).toHaveAttribute('href', 'https://digitalminds.guide/events');
    expect(screen.getByRole('link', { name: 'Future Impact Group' })).toHaveAttribute('href', 'https://futureimpact.group/ai-sentience');
    expect(screen.getByRole('link', { name: 'MATS' })).toHaveAttribute('href', 'https://www.matsprogram.org/');
    expect(screen.getByRole('link', { name: 'Sentient Futures' })).toHaveAttribute('href', 'https://www.sentientfutures.ai/projectincubator');
    expect(screen.queryByText(/continue contributing to AI safety/)).not.toBeInTheDocument();
  });
});
