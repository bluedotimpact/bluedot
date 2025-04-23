import { render } from '@testing-library/react';
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
  onExerciseSubmit: vi.fn(),
};

describe('FreeTextResponse', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.free-text-response__saved-msg')).toBeFalsy();
  });

  test('renders with saved exercise response', () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} exerciseResponse="This is my saved answer." />,
    );
    const textareaEl = container.querySelector('.free-text-response__textarea') as HTMLTextAreaElement;

    expect(container).toMatchSnapshot();
    expect(textareaEl.classList.contains('free-text-response__textarea--saved')).toBeTruthy();
    expect(textareaEl.value).toBe('This is my saved answer.');
  });
});
