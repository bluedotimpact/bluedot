import { render } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vi,
} from 'vitest';
import axios from 'axios';
import { useRouter } from 'next/router';
import FreeTextResponse from './FreeTextResponse';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

// Mock axios
vi.mock('axios');
// Setup axios mock to resolve successfully
(axios.put as Mock).mockResolvedValue({ data: {} });

const mockRouter = {
  asPath: '/test-path',
};

// Setup router mock before each test
beforeEach(() => {
  (useRouter as Mock).mockReturnValue(mockRouter);
});

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

  test('renders logged in as expected', () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} isLoggedIn />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.free-text-response__saved-msg')).toBeFalsy();
  });

  test('renders with saved exercise response', () => {
    const { container } = render(
      <FreeTextResponse {...mockArgs} exerciseResponse="This is my saved answer." isLoggedIn />,
    );
    const textareaEl = container.querySelector('.free-text-response__textarea') as HTMLTextAreaElement;

    expect(container).toMatchSnapshot();
    expect(textareaEl.classList.contains('free-text-response__textarea--saved')).toBeTruthy();
    expect(textareaEl.value).toBe('This is my saved answer.');
  });
});
