import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  describe, expect, it, vi,
} from 'vitest';
import ListenToArticleButton from './ListenToArticleButton';

describe('ListenToArticleButton', () => {
  const mockAudioUrl = 'https://open.spotify.com/episode/test123';
  const mockResourceTitle = 'Introduction to AI Safety';

  it('should render correctly', () => {
    const { container } = render(<ListenToArticleButton
      audioUrl={mockAudioUrl}
      resourceTitle={mockResourceTitle}
    />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should render with proper aria-label', () => {
    const { getByRole } = render(<ListenToArticleButton
      audioUrl={mockAudioUrl}
      resourceTitle={mockResourceTitle}
    />);
    const button = getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Listen to article: Introduction to AI Safety (opens in Spotify)');
  });

  it('should open audio URL in new tab when clicked', async () => {
    const user = userEvent.setup();
    const mockOpen = vi.fn();
    const originalOpen = window.open;
    window.open = mockOpen;

    const { getByRole } = render(<ListenToArticleButton
      audioUrl={mockAudioUrl}
      resourceTitle={mockResourceTitle}
    />);

    const button = getByRole('button');
    await user.click(button);

    expect(mockOpen).toHaveBeenCalledWith(
      mockAudioUrl,
      '_blank',
      'noopener,noreferrer',
    );

    window.open = originalOpen;
  });

  it('should render with different resource titles', () => {
    const { container, rerender } = render(<ListenToArticleButton
      audioUrl={mockAudioUrl}
      resourceTitle="First Article"
    />);
    const firstRender = container.innerHTML;

    rerender(<ListenToArticleButton
      audioUrl={mockAudioUrl}
      resourceTitle="Second Article with a Much Longer Title"
    />);
    const secondRender = container.innerHTML;

    expect(firstRender).not.toEqual(secondRender);
  });
});
