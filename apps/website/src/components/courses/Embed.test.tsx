// @vitest-environment-options {"settings":{"disableIframePageLoading":true}}
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Embed from './Embed';

describe('Embed', () => {
  test('renders course images with authored alternative text', () => {
    render(<Embed url="/images/chart.webp" alt="AI capabilities over time" />);
    expect(screen.getByRole('img', { name: 'AI capabilities over time' })).toHaveAttribute('src', '/images/chart.webp');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('provides a privacy-enhanced YouTube player and a direct playback fallback', () => {
    render(<Embed url="https://www.youtube.com/embed/dQw4w9WgXcQ?start=30" />);
    const player = screen.getByTitle('Course video');
    expect(player).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=30&rel=0');
    expect(player).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    const fallback = screen.getByRole('link', { name: 'Watch on YouTube' });
    expect(fallback).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(fallback).toHaveAttribute('target', '_blank');
    expect(fallback).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('keeps other embedded resources separate from YouTube controls', () => {
    render(<Embed url="https://example.com/resource" />);
    expect(screen.getByTitle('Embedded course resource')).toHaveAttribute('src', 'https://example.com/resource');
    expect(screen.queryByRole('link', { name: 'Watch on YouTube' })).not.toBeInTheDocument();
  });
});
