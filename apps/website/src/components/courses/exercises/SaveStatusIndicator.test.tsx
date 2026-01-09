import { render } from '@testing-library/react';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import SaveStatusIndicator from './SaveStatusIndicator';

describe('SaveStatusIndicator', () => {
  test('renders empty bar when status is idle', () => {
    const { container } = render(
      <SaveStatusIndicator
        status="idle"
        id="test-status"
      />,
    );

    const statusElement = container.querySelector('#test-status');
    expect(statusElement).toBeTruthy();
    expect(statusElement?.textContent).toBe('');
  });

  test('renders empty bar for typing status', () => {
    const { container } = render(
      <SaveStatusIndicator
        status="typing"
        id="test-status"
      />,
    );

    const statusElement = container.querySelector('#test-status');
    expect(statusElement).toBeTruthy();
    expect(statusElement?.textContent).toBe('');
  });

  test('renders saving status with spinner when saving', () => {
    const { container, getByText } = render(
      <SaveStatusIndicator
        status="saving"
        id="test-status"
      />,
    );

    expect(getByText('Saving...')).toBeTruthy();
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  test('renders saved status with checkmark when saved', () => {
    const { container, getByText } = render(
      <SaveStatusIndicator
        status="saved"
        id="test-status"
      />,
    );

    expect(getByText('Answer saved')).toBeTruthy();
    // Check for custom checkmark SVG
    expect(container.querySelector('svg')).toBeTruthy();
  });

  test('renders error status with retry button when error', () => {
    const mockRetry = vi.fn();
    const { getByText, getByRole } = render(
      <SaveStatusIndicator
        status="error"
        id="test-status"
        onRetry={mockRetry}
      />,
    );

    expect(getByText("Couldn't save answer.")).toBeTruthy();
    const retryButton = getByRole('button', { name: /retry/i });
    expect(retryButton).toBeTruthy();

    // Test retry functionality
    retryButton.click();
    expect(mockRetry).toHaveBeenCalledOnce();
  });

  test('has proper accessibility attributes', () => {
    const { container } = render(
      <SaveStatusIndicator
        status="saving"
        id="accessibility-test"
      />,
    );

    const statusElement = container.querySelector('#accessibility-test');
    expect(statusElement).toBeTruthy();
    expect(statusElement?.getAttribute('role')).toBe('status');
    expect(statusElement?.getAttribute('aria-live')).toBe('polite');
    expect(statusElement?.getAttribute('aria-atomic')).toBe('true');
  });
});
