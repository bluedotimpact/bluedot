import { render } from '@testing-library/react';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import SaveStatusIndicator from './SaveStatusIndicator';

describe('SaveStatusIndicator', () => {
  test('renders nothing when status is idle and not editing', () => {
    const { container } = render(
      <SaveStatusIndicator
        status="idle"
        isEditing={false}
        id="test-status"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders typing status when typing', () => {
    const { container, getByText } = render(
      <SaveStatusIndicator
        status="typing"
        isEditing={true}
        id="test-status"
      />
    );

    expect(getByText('Click outside to save your answer')).toBeTruthy();
    expect(container.querySelector('#test-status')).toBeTruthy();
  });

  test('renders saving status with spinner when saving', () => {
    const { container, getByText } = render(
      <SaveStatusIndicator
        status="saving"
        isEditing={true}
        id="test-status"
      />
    );

    expect(getByText('Saving answer...')).toBeTruthy();
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  test('renders saved status with checkmark when saved', () => {
    const { container, getByText } = render(
      <SaveStatusIndicator
        status="saved"
        isEditing={false}
        id="test-status"
      />
    );

    expect(getByText('Answer saved')).toBeTruthy();
    // Check for custom checkmark SVG
    expect(container.querySelector('svg')).toBeTruthy();
  });

  test('renders error status with retry button when error', () => {
    const mockRetry = vi.fn();
    const { container, getByText, getByRole } = render(
      <SaveStatusIndicator
        status="error"
        isEditing={false}
        id="test-status"
        onRetry={mockRetry}
      />
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
        isEditing={true}
        id="accessibility-test"
      />
    );

    const statusElement = container.querySelector('#accessibility-test');
    expect(statusElement).toBeTruthy();
    expect(statusElement?.getAttribute('role')).toBe('status');
    expect(statusElement?.getAttribute('aria-live')).toBe('polite');
    expect(statusElement?.getAttribute('aria-atomic')).toBe('true');
  });
});