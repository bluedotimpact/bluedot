import { render, waitFor } from '@testing-library/react';
import {
  describe,
  expect,
  Mock,
  test,
  vi,
} from 'vitest';
import axios from 'axios';
import FreeTextResponse from './FreeTextResponse';

// Mock axios
vi.mock('axios');
// Setup axios mock to resolve successfully
(axios.put as Mock).mockResolvedValue({ data: {} });

const mockArgs = {
  title: 'Understanding LLMs',
  description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
  exerciseId: 'rec1234567890',
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

    // Add some text to the textarea
    const testAnswer = 'My test answer';
    textareaEl.textContent = testAnswer;

    // Submit an answer
    const submitEl = container.querySelector('.free-text-response__submit') as HTMLElement;
    submitEl?.click();

    // Verify axios was called with correct arguments
    expect(axios.put).toHaveBeenCalledWith(
      `/api/courses/exercises/${mockArgs.exerciseId}/response`,
      { response: testAnswer },
    );

    // Expect 'saved' state change after axios resolves
    await waitFor(() => {
      expect(textareaEl.classList.contains('free-text-response__textarea--saved')).toBeTruthy();
      expect(container.querySelector('.free-text-response__saved-msg')).toMatchSnapshot();
    });
  });
});
