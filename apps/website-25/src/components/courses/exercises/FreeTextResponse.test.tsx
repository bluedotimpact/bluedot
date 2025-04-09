import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import FreeTextResponse from './FreeTextResponse';

const mockArgs = {
  title: 'Understanding LLMs',
  description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
};

describe('FreeTextResponse', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.free-text-response__saved-msg')).toBeFalsy();
  });

  test('updates styles when answer is saved', async () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} />,
    );
    const textareaEl = container.querySelector('.free-text-response__textarea') as HTMLElement;
    // Submit an answer
    const submitEl = container.querySelector('.free-text-response__submit') as HTMLElement;
    expect(submitEl).toBeTruthy();
    submitEl?.click();
    // Expect 'saved' state change
    await waitFor(() => {
      expect(textareaEl.classList.contains('free-text-response__textarea--saved')).toBeTruthy();
      expect(container.querySelector('.free-text-response__saved-msg')).toMatchSnapshot();
    });
  });
});
